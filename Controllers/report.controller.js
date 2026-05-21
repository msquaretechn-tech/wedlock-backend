import Report from '../Models/report.model.js';
import { catchAsyncError } from '../Middlewares/catchAsyncError.js';
import errorhandler from '../Utils/errorhandler.js';

// Create a new report
export const reportUser = catchAsyncError(async (req, res, next) => {
    const reporterUserId = req.user.userId;
    const { reportedUserId, reason } = req.body;

    if (!reportedUserId || !reason) {
        return next(new errorhandler("Reported user ID and reason are required", 400));
    }

    let formattedReason;

    if (Array.isArray(reason)) {
        if (reason.length === 0) {
            return next(new errorhandler("Reason array cannot be empty", 400));
        }
        formattedReason = reason;
    } else if (typeof reason === 'string') {
        formattedReason = [reason]; // wrap single string in array
    } else {
        return next(new errorhandler("Reason must be a string or array", 400));
    }

    const report = await Report.create({ reporterUserId, reportedUserId, reason: formattedReason });

    res.status(201).json({
        success: true,
        message: "User reported successfully",
        data: report
    });
});

// Get reports made by current user
export const getMyReports = catchAsyncError(async (req, res, next) => {
    const reporterUserId = req.user.userId;

    const reports = await Report.findAll({
        where: { reporterUserId },
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: reports
    });
});

// Admin route: Get all reports
export const getAllReports = catchAsyncError(async (req, res, next) => {
    const reports = await Report.findAll({
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: reports
    });
});