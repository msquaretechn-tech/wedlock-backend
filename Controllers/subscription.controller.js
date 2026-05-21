import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import subscription from "../Models/subscription.model.js";
import User from '../Models/user.js'
import Recommendation from "../Models/recommendation.model.js";
import { v4 as uuidv4 } from "uuid";
import plan from "../Models/plan.model.js";
import Stripe from "stripe";
import cron from "node-cron";
import moment from 'moment';
import { Op } from "sequelize";
import paypalClient from "../config/paypal.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = catchAsyncError(
    async (req, res, next) => {
        console.log("🚀 ~ createCheckoutSession ~ req:", req.body)

        try {
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
            console.error(
                "Checkout Error:",
                error.message
            );

            return next(
                new errorhandler(
                    "Failed to create checkout session",
                    500
                )
            );
        }
    }
);

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
export const handleAutoExpiry = catchAsyncError(async (req, res, next) => {
    try {
        const subscriptionData = await subscription.findAll();

        if (!subscriptionData) {
            return next(new errorhandler("Subscription not found!", 404));
        }

        const today = new Date();

        subscriptionData.forEach(async (subscription) => {
            if (subscription.endDate && subscription.endDate < today) {
                await subscription.update({ status: 'Expired' });
                await User.update({ usertype: 'Standard' }, { where: { userId: subscription.userId } });
            }
        });

        console.log("Subscription updated successfully!");
    } catch (error) {
        console.error("Error updating subscriptions:", error.message);
    }

})
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
    handleAutoExpiry();
});