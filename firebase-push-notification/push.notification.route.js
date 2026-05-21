import express from "express";

import { sendFCMNotification } from './push.notification.controller.js';

import { isAdminAuthenticated } from '../Middlewares/Admin/isAdminAuthenticated.js';

const fcmNotificationRouter = express.Router();

fcmNotificationRouter.post('/send-fcm-notification',sendFCMNotification)

export default fcmNotificationRouter;