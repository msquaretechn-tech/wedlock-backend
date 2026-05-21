import admin from 'firebase-admin';
import errorhandler from "../Utils/errorhandler.js";
import fs from "fs";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import path from "path";
import Notification from '../Models/notification.model.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "../config/serviceAccountKey.json");

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

export const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const sendNotification = catchAsyncError(async (req, res, next) => {
    try {
        const { token, title, body, data } = req.body;

        if (!token) {
            return next(new errorhandler("fcmToken is required", 400));
        }

        if (!title) {
            return next(new errorhandler("Notification title is required", 400));
        }

        if (!body) {
            return next(new errorhandler("Notification body is required", 400));
        }

        // Construct message payload
        const message = {
            token: token,
            notification: {
                title: title,
                body: body,
            },
            data: {
                ...data,
            },
            
        };

        const response = await admin.messaging().send(message);

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});


export const getAllNotification = catchAsyncError(async (req, res, next) => {

    try{
        const userId = req.user.userId;
        
        const notifications = await Notification.findAll({where: {userId}, order: [['createdAt', 'DESC']]});

      
        if(!notifications){
            return next(new errorhandler("Notification not found!", 404));
        }

      
        const data = notifications.map((notification) => {
            return {
                notificationId: notification.notificationId,
                title: notification.title,
                message: notification.message,
                body: notification.body,
                data: notification.data,
            }
        })


        res.status(200).json({
            success: true,
            data: data
        })

    }catch(error){
        return next(new errorhandler(error.message, 500));
    }
})


export const deleteNotification = catchAsyncError(async (req, res, next) => {
    try{

        const {notificationId} = req.body;
    
        const notifications = await Notification.destroy({where: {notificationId}});

        if(!notifications){
            return next(new errorhandler("Notification not found!", 404));
        }
        res.status(200).json({
            success: true,
            data: notifications
        })

    }catch(error){
        return next(new errorhandler(error.message, 500));
    }
})