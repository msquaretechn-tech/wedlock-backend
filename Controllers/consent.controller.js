import UserConsentLog from "../Models/userConsentLog.model.js";
import User from "../Models/user.js";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";

/**
 * Record user consents (Age Gate, Terms/Privacy Policy, Sensitive Info, Marketing)
 * For audit and legal compliance.
 */
export const recordUserConsent = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.body.userId;
        const {
            noticeVersion = "v1.0",
            ageGatePassed = true,
            consentTermsAndAge = true,
            consentSensitiveInfo = true,
            marketingConsent = false,
            marketingNoticeVersion = "mkt-v1.0",
        } = req.body;

        if (!userId) {
            return next(new errorhandler("User ID is required!", 400));
        }

        if (!consentTermsAndAge || !consentSensitiveInfo) {
            return next(new errorhandler("Both Terms/Age consent and Sensitive Information consent are required!", 400));
        }

        const user = await User.findOne({ where: { userId } });
        if (!user) {
            return next(new errorhandler("User not found!", 404));
        }

        const consentLog = await UserConsentLog.create({
            userId,
            noticeVersion,
            dateAndTimeShown: new Date(),
            ageGatePassed,
            consentTermsAndAge,
            consentSensitiveInfo,
            marketingConsent: Boolean(marketingConsent),
            marketingNoticeVersion,
        });

        res.status(201).json({
            success: true,
            message: "User consent record stored successfully!",
            data: consentLog,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

/**
 * Fetch consent logs for a single user (for legal regulator audit requests)
 */
export const getUserConsentLog = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return next(new errorhandler("User ID is required!", 400));
        }

        const consentLogs = await UserConsentLog.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
        });

        if (!consentLogs || consentLogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No consent audit records found for this user!",
            });
        }

        res.status(200).json({
            success: true,
            data: consentLogs,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

/**
 * Age verification check before registration / account creation.
 * Underage users (age < 18) are rejected immediately.
 * No data is retained and no account is created.
 */
export const verifyAgeGate = catchAsyncError(async (req, res, next) => {
    try {
        const { day, month, year, dateOfBirth } = req.body;

        let dob;
        if (dateOfBirth) {
            dob = new Date(dateOfBirth);
        } else if (day && month && year) {
            dob = new Date(year, month - 1, day);
        } else {
            return next(new errorhandler("Please provide a valid date of birth (DD, MM, YYYY).", 400));
        }

        if (isNaN(dob.getTime())) {
            return next(new errorhandler("Invalid Date of Birth format!", 400));
        }

        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age < 18) {
            return res.status(400).json({
                success: false,
                isEligible: false,
                message: "Sorry — Wedlock is only for people aged 18 and over. Thanks for your interest, and we hope to see you in the future.",
            });
        }

        return res.status(200).json({
            success: true,
            isEligible: true,
            message: "Age check passed successfully. You are eligible to create an account.",
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});
