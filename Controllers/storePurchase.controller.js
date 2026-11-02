import axios from "axios";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import subscription from "../Models/subscription.model.js";
import plan from "../Models/plan.model.js";
import User from "../Models/user.js";
import Recommendation from "../Models/recommendation.model.js";

// Verifies Apple In-App Purchase and Google Play Billing subscriptions bought
// in the mobile app, then activates the matching Wedlock plan.
//
// Required env:
//   APPLE_SHARED_SECRET                - App Store Connect > App > Subscriptions > App-Specific Shared Secret
//   GOOGLE_PLAY_PACKAGE_NAME           - defaults to com.wedlock.wedlock_application
//   GOOGLE_PLAY_SERVICE_ACCOUNT_KEY    - path to a service-account JSON that has
//                                        "View financial data" access in Play Console

const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const GOOGLE_PLAY_PACKAGE_NAME =
    process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.wedlock.wedlock_application";

// Product IDs look like com.wedlock.wedlock.premium.monthly on both stores.
const findPlan = async (planId, productId) => {
    if (planId) {
        const byId = await plan.findOne({ where: { planId } });
        if (byId) return byId;
    }
    const id = (productId || "").toLowerCase();
    const planName = id.includes("exclusive") ? "Exclusive" : id.includes("premium") ? "Premium" : null;
    if (!planName) return null;
    const durationInMonths = id.includes("year") ? 12 : 1;
    return plan.findOne({ where: { planName, durationInMonths } });
};

// Creates the subscription once per store transaction, or extends it on renewal/restore.
const activatePlan = async (userId, planData, storeTransactionId, endDate) => {
    const existing = await subscription.findOne({
        where: { userId, paymentSucessId: storeTransactionId },
    });

    if (existing) {
        await existing.update({
            planId: planData.planId,
            endDate,
            status: "Active",
            paymentStatus: "Completed",
        });
    } else {
        await subscription.create({
            orderId: `WDL${uuidv4().split("-")[0].toUpperCase()}`,
            planId: planData.planId,
            userId,
            paymentSucessId: storeTransactionId,
            endDate,
            deviceType: "Mobile",
            status: "Active",
            paymentStatus: "Completed",
        });
    }

    await User.update({ usertype: planData.planName }, { where: { userId } });
    await Recommendation.update({ usertype: planData.planName }, { where: { userId } });
};

const postAppleReceipt = async (url, receiptData) => {
    const { data } = await axios.post(url, {
        "receipt-data": receiptData,
        password: process.env.APPLE_SHARED_SECRET,
        "exclude-old-transactions": true,
    });
    return data;
};

export const verifyApplePurchase = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;
    const { planId, productId, receiptData } = req.body;

    if (!productId || !receiptData) {
        return next(new errorhandler("Product ID and receipt data are required", 400));
    }

    // Always try production first; App Review and TestFlight use sandbox (status 21007).
    let receipt = await postAppleReceipt(APPLE_PRODUCTION_URL, receiptData);
    if (receipt.status === 21007) {
        receipt = await postAppleReceipt(APPLE_SANDBOX_URL, receiptData);
    }
    if (receipt.status !== 0) {
        return res.status(400).json({ success: false, message: `Invalid receipt (status ${receipt.status})` });
    }

    const latest = (receipt.latest_receipt_info || receipt.receipt?.in_app || [])
        .filter((t) => t.product_id === productId)
        .sort((a, b) => Number(b.expires_date_ms || 0) - Number(a.expires_date_ms || 0))[0];

    if (!latest || Number(latest.expires_date_ms) <= Date.now()) {
        return res.status(400).json({ success: false, message: "No active subscription found in receipt" });
    }

    const planData = await findPlan(planId, productId);
    if (!planData) {
        return next(new errorhandler("Plan not found!", 404));
    }

    await activatePlan(userId, planData, latest.original_transaction_id, new Date(Number(latest.expires_date_ms)));

    res.status(200).json({ success: true, message: "Subscription activated", planName: planData.planName });
});

const getAndroidPublisher = () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    return google.androidpublisher({ version: "v3", auth });
};

export const verifyGooglePurchase = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;
    const { planId, productId, purchaseToken } = req.body;

    if (!productId || !purchaseToken) {
        return next(new errorhandler("Product ID and purchase token are required", 400));
    }

    let purchase;
    try {
        const { data } = await getAndroidPublisher().purchases.subscriptionsv2.get({
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
            token: purchaseToken,
        });
        purchase = data;
    } catch (error) {
        return res.status(400).json({ success: false, message: `Invalid purchase token: ${error.message}` });
    }

    const activeStates = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"];
    const lineItem = (purchase.lineItems || []).find((item) => item.productId === productId);

    if (!activeStates.includes(purchase.subscriptionState) || !lineItem) {
        return res.status(400).json({ success: false, message: "No active subscription found for this purchase" });
    }

    const planData = await findPlan(planId, productId);
    if (!planData) {
        return next(new errorhandler("Plan not found!", 404));
    }

    // latestOrderId (e.g. GPA.1234-...) is stable per subscription and fits the column;
    // renewals append "..0", "..1", so strip that suffix to keep one row per subscription.
    const orderId = (purchase.latestOrderId || "").replace(/\.\.\d+$/, "") || purchaseToken.slice(0, 200);

    await activatePlan(userId, planData, orderId, new Date(lineItem.expiryTime));

    // The app acknowledges the purchase after this returns success.
    res.status(200).json({ success: true, message: "Subscription activated", planName: planData.planName });
});
