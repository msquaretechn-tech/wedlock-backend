import dotenv from 'dotenv';
import express from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from './Middlewares/error.js'
import userRouter from './routes/user.routes.js';
import questionRouter from "./routes/question.routes.js"
import formRouter from "./routes/forms.routes.js"
import profileRouter from './routes/profile.routes.js';
import happyStoryRouter from './routes/happyStory.routes.js';
import favProfileRouter from './routes/favProfile.routes.js';
import connectionRouter from './routes/connection.routes.js';

import notificationRouter from './routes/notification.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import dropdownRouter from './routes/dropdown.routes.js';
import billingRouter from './routes/billing.routes.js';
import callRouter from './routes/call.routes.js'
import featureRouter from './routes/feature.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import toggleRouter from './routes/toggle.routes.js';
import BlockRouter from './routes/block.routes.js';
import ReportRouter from './routes/report.routes.js';
import filerouter from './routes/file.routes.js';
import adminRouter from './routes/Admin/admin.auth.routes.js';
import adminDashboardRouter from './routes/Admin/admin.user.stats.route.js';
import admintransactionRouter from './routes/Admin/admin.user.transaction.routes.js';
import adminUserDetailsRouter from './routes/Admin/admin.user.detail.routers.js';
import adminControlOverUserRouter from './routes/Admin/admin-control-over-user-routes.js';
import fcmNotificationRouter from './firebase-push-notification/push.notification.route.js';
import contactRouter from './routes/contact.routes.js';
import planRouter from './routes/Admin/plan.routes.js';
import AdminSuspendUser from './routes/Admin/suspendedUser.routes.js';
dotenv.config();



app.use("/api/v1/payment-process", webhookRouter);
app.use(express.json({ limit: "50mb" }));
app.use(express.static("./public"));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());


app.use(cors({
  origin: [
    "https://wedlock.com.au",
    "https://admin.wedlock.au",
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5175",
    "https://recommend.wedlock.com.au",
    "https://admin.wedlock.com.au"


  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());




app.use("/api/v1/user", userRouter);
app.use("/api/v1/question", questionRouter);
app.use("/api/v1/form", formRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/profile/favorite", favProfileRouter);
app.use("/api/v1/connection", connectionRouter);
app.use("/api/v1/happyStories", happyStoryRouter);
app.use("/api/v1/plan", planRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/call", callRouter);
app.use('/api/v1/dropdown',dropdownRouter);
app.use('/api/v1/feature',featureRouter);
app.use('/api/v1/toggle',toggleRouter);
 app.use('/api/v1/block', BlockRouter);
app.use('/api/v1/report', ReportRouter);
app.use("/api/v1/files", filerouter);
app.use('/api/v1/contact',contactRouter)
app.use('/api/v1/admin/auth',adminRouter)
app.use('/api/v1/admin-dashboard', adminDashboardRouter);
app.use('/api/v1/admin-transaction',admintransactionRouter)
app.use('/api/v1/admin-userDetails',adminUserDetailsRouter)
app.use('/api/v1/admin-userControl',adminControlOverUserRouter)
app.use('/api/v1/admin-notification',fcmNotificationRouter)
app.use('/api/v1/admin-suspendControl',AdminSuspendUser)

app.get("/test", async (req, res, next) => {
  res.status(200).json({
    success: true, message: "Api is working"
  })
})


app.use(ErrorMiddleware);

 