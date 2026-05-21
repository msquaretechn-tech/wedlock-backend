
import moment from "moment";

import { Op } from "sequelize";
import { Parser } from "json2csv";



import Subscription from "../../Models/subscription.model.js";
import User from "../../Models/user.js";
import { catchAsyncError } from "../../Middlewares/catchAsyncError.js";
import errorhandler from "../../Utils/errorhandler.js";
import PersonalDetails from "../../Models/personalDetails.model.js";
import Plan from "../../Models/plan.model.js";



export const getAllBillingInfo = catchAsyncError(async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ["userId", "email", "usertype"],
            include: [
                {
                    model: PersonalDetails,
                    as: "personalDetails",
                    attributes: ["displayName"],
                },
            ],
        });

        const billingData = await Promise.all(
            users.map(async (user) => {
                const latestSubscription = await Subscription.findOne({
                    where: { userId: user.userId },
                    order: [["createdAt", "DESC"]],
                    include: [
                        {
                            model: Plan,
                            as: "plans",
                            attributes: ["planName", "price", "durationInMonths"],
                        },
                    ],
                });

                const displayName = user.personalDetails?.[0]?.displayName || "";

                if (!latestSubscription) {
                    return {
                        userId: user.userId,
                        name: displayName,
                        email: user.email,
                        currentPlan: user.usertype || "Standard",
                        totalDays: 0,
                        expirationDate: "N/A",
                        planType: "N/A",
                        remainingDays: 0,
                        notifications: false,
                        price: "Free",
                        status: "Inactive"
                    };
                }

                const planData = latestSubscription.plans;
                const today = moment().startOf("day");
                const startDate = moment(latestSubscription.startDate).startOf("day");
                const expirationDate = moment(latestSubscription.endDate).startOf("day");

                const totalDays = expirationDate.diff(startDate, "days");
                const remainingDays = expirationDate.diff(today, "days");
                const isYearly = planData?.durationInMonths >= 12;

                return {
                    userId: user.userId,
                    name: displayName,
                    email: user.email,
                    currentPlan: planData?.planName || user.usertype || "Unknown",
                    totalDays,
                    expirationDate: expirationDate.format("ll"),
                    planType: isYearly ? "Yearly" : "Monthly",
                    remainingDays: remainingDays > 0 ? remainingDays : 0,
                    notifications: remainingDays <= 6 && remainingDays > 0,
                    price: `${planData?.price || 0}`,
                    status: latestSubscription.status
                };
            })
        );

        res.status(200).json({
            success: true,
            data: billingData,
            message: "All users' billing information fetched successfully!",
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const getFinancialReport = catchAsyncError(async (req, res, next) => {
    try {
        const { period = "month", exportType } = req.query;

        const now = moment();
        let startDate;
        switch (period) {
            case "day":
                startDate = moment().startOf("day");
                break;
            case "week":
                startDate = moment().startOf("isoWeek");
                break;
            case "month":
                startDate = moment().startOf("month");
                break;
            case "year":
                startDate = moment().startOf("year");
                break;
            default:
                return next(new errorhandler("Invalid period type", 400));
        }

        const subscriptions = await Subscription.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate.toDate(),
                    [Op.lte]: now.toDate(),
                },
                paymentStatus: "Completed"
            },
            include: [
                {
                    model: Plan,
                    as: "plans",
                    attributes: ["planName", "price", "durationInMonths"],
                },
                {
                    model: User,
                    as: "users",
                    attributes: ["userId", "email"],
                    include: [
                        {
                            model: PersonalDetails,
                            as: "personalDetails",
                            attributes: ["firstName", "lastName", "displayName"],
                        },
                    ],
                },
            ],
        });

        const report = subscriptions.map((sub) => {
            const pd = sub.users?.personalDetails?.[0];
            const fullName =
                pd?.displayName ||
                [pd?.firstName, pd?.lastName].filter(Boolean).join(" ") ||
                "";

            return {
                userId: sub.users?.userId,
                name: fullName,
                email: sub.users?.email,
                plan: sub.plans?.planName || "Standard",
                price: sub.plans?.price || "0",
                createdAt: moment(sub.createdAt).format("YYYY-MM-DD"),
                paymentStatus: sub.paymentStatus,
                subscriptionStatus: sub.status,
                duration: sub.plans?.durationInMonths ? `${sub.plans.durationInMonths} months` : "N/A"
            };
        });

        if (exportType === "csv") {
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(report);
            res.header("Content-Type", "text/csv");
            res.attachment(`financial_report_${period}_${now.format("YYYY-MM-DD")}.csv`);
            return res.send(csv);
        }

        res.status(200).json({
            success: true,
            period,
            count: report.length,
            totalRevenue: report.reduce((acc, r) => acc + (parseFloat(r.price) || 0), 0),
            data: report,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});