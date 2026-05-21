import errorhandler from "../Utils/errorhandler.js";
import User from "../Models/user.js";
import Call from "../Models/call.model.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";



export const UpdateCallDuration = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { callieId, totalCallDuration } = req.body;

        if (!callieId || !totalCallDuration) {
            return next(new errorhandler("Please enter all details", 400));
        }

        const CallieUser = await User.findOne({ where: { uid: callieId } });
        const CallerUser = await User.findOne({ where: { userId } });

        if (!CallieUser || !CallerUser) {
            return next(new errorhandler("User not found!", 404));
        }

        const recieverId = CallieUser.userId;
        const callerId = CallerUser.uid;

        let callRecord = await Call.findOne({
            where: { callerId, callieId },
        });

        if (callRecord) {
            callRecord.totalCallDuration = totalCallDuration; 
            await callRecord.save();
        } else {
            callRecord = await Call.create({
                userId,
                callerId,
                callieId,
                recieverId,
                totalCallDuration,
            });
        }

        res.status(200).json({
            success: true,
            data: callRecord,
            message: callRecord.isNewRecord
                ? "Call created successfully!"
                : "Call updated successfully!",
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const getCallDuration = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.user;
        const {callieId} = req.params;


        const CallerUser = await User.findOne({ where: { userId } });
        if (!CallerUser) {
            return next(new errorhandler("User not found!", 404));
        }

        const callDuration = await Call.findOne({
             where: {
                callieId: callieId,
                callerId: CallerUser.uid
            }
        });


        if (!callDuration) {
            return res.status(404).json({ success: false, message: "callDuration remainig not found!" });
        }

        res.status(200).json({ success: true, data:callDuration });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
}
);
