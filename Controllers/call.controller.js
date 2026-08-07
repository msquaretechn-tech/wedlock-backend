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
});

import { generateZegoToken } from "../Utils/zegoToken.js";

export const getZegoToken = catchAsyncError(async (req, res, next) => {
    try {
        const rawUserId = req.body.userID || req.body.userId || req.user.uid || req.user.userId || req.user._id || req.user.id;
        const targetUserId = String(rawUserId).replace(/-/g, '').slice(0, 32);
        const { roomID, effectiveTime } = req.body;

        const appId = process.env.ZEGO_APP_ID || 1202014598;
        const serverSecret = process.env.ZEGO_SERVER_SECRET;

        console.log("[ZegoToken] Generating token for userId:", targetUserId);
        console.log("[ZegoToken] ZEGO_APP_ID:", appId);
        console.log("[ZegoToken] ZEGO_SERVER_SECRET exists:", !!serverSecret);
        console.log("[ZegoToken] ZEGO_SERVER_SECRET length:", serverSecret ? serverSecret.length : 0);

        if (!serverSecret) {
            return next(new errorhandler("ZEGO_SERVER_SECRET is not configured in .env", 500));
        }

        const validTime = effectiveTime ? Number(effectiveTime) : 3600;
        const kitToken = generateZegoToken(
            Number(appId),
            serverSecret,
            targetUserId,
            validTime,
            ""
        );

        return res.status(200).json({
            success: true,
            appID: Number(appId),
            userID: targetUserId,
            roomID: roomID || `room_${targetUserId}`,
            kitToken: kitToken,
            message: "Zego token generated successfully!"
        });
    } catch (error) {
        console.error("[ZegoToken] Error:", error.message);
        return next(new errorhandler(error.message, 500));
    }
});

