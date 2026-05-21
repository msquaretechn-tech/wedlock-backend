import express from "express";
import { sendNotification ,getAllNotification,deleteNotification} from "../Controllers/notification.controller.js";
import { isAuthenticated } from "../Middlewares/auth.js";


const notificationRouter = express.Router();

notificationRouter.post('/sendNotification' ,isAuthenticated,sendNotification);
notificationRouter.get('/getAllNotification',isAuthenticated,getAllNotification);
notificationRouter.delete('/deleteNotification',isAuthenticated,deleteNotification)

export default notificationRouter 