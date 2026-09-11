import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import subscription from "../Models/subscription.model.js";
import User from '../Models/user.js'
import personalDetails from "../Models/personalDetails.model.js";
import Recommendation from "../Models/recommendation.model.js";
import { v4 as uuidv4 } from "uuid";
import plan from "../Models/plan.model.js";
import Stripe from "stripe";
import cron from "node-cron";
import moment from 'moment';
import { Op } from "sequelize";
import paypalClient from "../config/paypal.js";
import paypal from "@paypal/checkout-server-sdk";
import sendEmail from "../Utils/sendMail.js";
import { validateExclusiveEligibility, EXCLUSIVE_CRITERIA_LIST } from "../Utils/exclusiveCriteria.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = catchAsyncError(
    async (req, res, next) => {

        const userId = req.user.userId;
        const { planId: planIdLower, planID: planIdUpper, paymentMethod } = req.body;
        const planId = planIdLower || planIdUpper; // accept both planId and planID

        if (!planId || !paymentMethod) {
            return next(
                new errorhandler(
                    "Plan ID and payment method are required",
                    400
                )
            );
        }

        const planData = await plan.findOne({
            where: { planId },
        });

        if (!planData) {
            return next(new errorhandler("Plan not found", 404));
        }

        // Validate Exclusive plan criteria
        if (planData.planName === "Exclusive") {
            const eligibility = await validateExclusiveEligibility(userId, req.body);
            if (!eligibility.isEligible) {
                const message = eligibility.message || (eligibility.unmatchedCriteria?.length > 0
                    ? eligibility.unmatchedCriteria.join(" ")
                    : "You are not eligible to purchase the Exclusive plan.");

                return res.status(400).json({
                    success: false,
                    message,
                    unmatchedCriteria: eligibility.unmatchedCriteria,
                    details: eligibility.details
                });
            }
        }

        try {
            // ==========================
            // STRIPE PAYMENT
            // ==========================
            if (paymentMethod === "stripe") {
                const session =
                    await stripe.checkout.sessions.create({
                        payment_method_types: ["card", "klarna"],
                        line_items: [
                            {
                                price_data: {
                                    currency: "aud",
                                    product_data: {
                                        name: planData.planName,
                                        description:
                                            planData.description,
                                    },
                                    unit_amount: Math.round(
                                        planData.price * 100
                                    ),
                                },
                                quantity: 1,
                            },
                        ],
                        mode: "payment",
                        customer_email: req.user.email,
                        success_url: `${process.env.FRONTEND_URL}/Payment-Success`,
                        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                        metadata: {
                            planId,
                            userId,
                            paymentMethod: "stripe",
                        },
                    });

                return res.status(201).json({
                    success: true,
                    provider: "stripe",
                    url: session.url,
                });
            }

            // ==========================
            // PAYPAL PAYMENT
            // ==========================
            if (paymentMethod === "paypal") {
                const request =
                    new paypal.orders.OrdersCreateRequest();

                request.prefer("return=representation");

                request.requestBody({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            amount: {
                                currency_code: "AUD",
                                value: planData.price.toString(),
                            },
                            description:
                                planData.planName,
                            custom_id: JSON.stringify({
                                userId,
                                planId,
                            }),
                        },
                    ],
                    application_context: {
                        brand_name: "Wedlock",
                        landing_page: "LOGIN",
                        user_action: "PAY_NOW",
                        return_url: `${process.env.FRONTEND_URL}/Payment-Success`,
                        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                    },
                });

                const order =
                    await paypalClient.execute(request);

                const approvalUrl =
                    order.result.links.find(
                        (link) => link.rel === "approve"
                    )?.href;

                return res.status(201).json({
                    success: true,
                    provider: "paypal",
                    url: approvalUrl,
                    orderId: order.result.id,
                });
            }

            return next(
                new errorhandler(
                    "Invalid payment method",
                    400
                )
            );
        } catch (error) {
            console.error("Checkout Error:", error.message);
            console.error("Checkout Error Stack:", error.stack || error);

            return next(
                new errorhandler(
                    error.message || "Failed to create checkout session",
                    500
                )
            );
        }
    }
);

// for checking the subscription status
export const checkSubscriptionStatus = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user.userId;


        // Get the latest active subscription
        const user = await User.findOne({ where: { userId } });

        res.status(200).json({
            success: true,
            usertype: user.usertype,
        });

    } catch (error) {
        return next(new errorhandler("Failed to fetch subscription status", 500));
    }
});
export const handlePaymentProcessForMobile = catchAsyncError(async (req, res, next) => {
    try {

        const userId = req.user.userId;

        const { paymentSucessId, planId } = req.body;

        if (!paymentSucessId || !planId) {
            return next(new errorhandler("Session ID or plan ID is missing", 400));
        }

        const planData = await plan.findOne({ where: { planId } });

        if (!planData) {
            return next(new errorhandler("Plan not found!", 404));
        }

        // Validate Exclusive plan criteria
        if (planData.planName === "Exclusive") {
            const eligibility = await validateExclusiveEligibility(userId, req.body);
            if (!eligibility.isEligible) {
                const message = eligibility.message || (eligibility.unmatchedCriteria?.length > 0
                    ? eligibility.unmatchedCriteria.join(" ")
                    : "You are not eligible to purchase the Exclusive plan.");

                return res.status(400).json({
                    success: false,
                    message,
                    unmatchedCriteria: eligibility.unmatchedCriteria,
                    details: eligibility.details
                });
            }
        }

        const endDate = moment().add(planData.durationInMonths, 'months').toDate();

        const orderId = `WDL${uuidv4().split('-')[0].toUpperCase()}`;

        const subscriptionData = await subscription.create({
            orderId,
            planId,
            userId,
            paymentSucessId,
            endDate,
            deviceType: 'Mobile',
            paymentStatus: 'Completed',
        });

        if (subscriptionData !== null) {

            const user = await User.findOne({ where: { userId } });
            if (user !== null) {
                await User.update({ usertype: planData.planName }, { where: { userId } });
                await Recommendation.update({ usertype: planData.planName }, { where: { userId } });
            }
        }

        res.status(201).json({
            success: true,
            message: "Subscription created successfully!",
        });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

// Check exclusive plan eligibility for logged-in user
export const checkExclusiveEligibility = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const result = await validateExclusiveEligibility(userId, payload);

        return res.status(200).json({
            success: true,
            isEligible: result.isEligible,
            message: result.message,
            unmatchedCriteria: result.unmatchedCriteria,
            details: result.details,
            allCriteria: EXCLUSIVE_CRITERIA_LIST
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});
export const processSubscriptionExpiry = async () => {
    try {
        console.log("----- Starting Subscription Expiry Check -----");
        const today = new Date();

        const expiredSubscriptions = await subscription.findAll({
            where: {
                endDate: { [Op.lt]: today },
                status: { [Op.ne]: 'Expired' }
            }
        });

        console.log(`Found ${expiredSubscriptions.length} subscriptions to expire.`);

        let processedCount = 0;

        for (const sub of expiredSubscriptions) {
            try {
                // 1. Status update karo
                await sub.update({ status: 'Expired' });
                await User.update({ usertype: 'Standard' }, { where: { userId: sub.userId } });
                await Recommendation.update({ usertype: 'Standard' }, { where: { userId: sub.userId } });

                // 2. User data fetch karo
                const user = await User.findOne({ where: { userId: sub.userId } });
                const personalDetail = await personalDetails.findOne({ where: { userId: sub.userId } });
                const planData = await plan.findOne({ where: { planId: sub.planId } });

                const userName = personalDetail
                    ? `${personalDetail.firstName || ''} ${personalDetail.lastName || ''}`.trim() || 'User'
                    : 'User';

                // 3. Email bhejo
                if (user && user.email) {
                    try {
                        await sendEmail({
                            email: user.email,
                            subject: "Your Wedlock Subscription Has Expired",
                            template: "subscription-expiry.ejs",
                            data: {
                                name: userName,
                                planName: planData?.planName || "Premium",
                                expiryDate: moment(sub.endDate).format('DD MMMM YYYY'),
                            }
                        });
                        console.log(`Expiry email sent successfully to ${user.email}`);
                    } catch (emailError) {
                        console.error(`Failed to send expiry email to ${user.email}:`, emailError.message);
                    }
                }

                processedCount++;
            } catch (subError) {
                console.error(`Error processing subscription ID ${sub.id}:`, subError.message);
            }
        }

        console.log(`----- Finished Subscription Expiry Check. Processed: ${processedCount} -----`);
        return { totalFound: expiredSubscriptions.length, processed: processedCount };
    } catch (error) {
        console.error("Error running subscription expiry:", error.message);
        throw error;
    }
};

export const handleAutoExpiry = catchAsyncError(async (req, res, next) => {
    try {
        const result = await processSubscriptionExpiry();

        if (res) {
            return res.status(200).json({
                success: true,
                message: `Subscription expiry check completed. ${result.processed} subscription(s) processed.`,
                data: result
            });
        }
    } catch (error) {
        if (res && next) {
            return next(new errorhandler(error.message, 500));
        }
    }
});
export const getSubscriptionPurchaseHistory = catchAsyncError(async (req, res, next) => {

    try {
        const userId = req.user.userId;

        const subscriptionData = await subscription.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });

        const planData = await plan.findAll({
            where: { planId: { [Op.in]: subscriptionData.map((sub) => sub.planId) } },
        });

        if (!subscriptionData || subscriptionData.length === 0) {
            return next(new errorhandler("Subscription not found!", 404));
        }

        const data = subscriptionData.map((sub) => {
            return {
                orderId: sub.orderId,
                paymentStatus: sub.paymentStatus,
                planName: planData.find((plan) => plan.planId === sub.planId).planName.split(' ').join('-'),
                purchaseDate: moment(sub.createdAt).format('DD-MM-YYYY'),
                amount: planData.find((plan) => plan.planId === sub.planId).price
            }
        })

        res.status(200).json({
            success: true,
            message: "Subscription fetched successfully!",
            data: data
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check at midnight...');
    await processSubscriptionExpiry();
});


