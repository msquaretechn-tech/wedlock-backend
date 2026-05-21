import express from "express";
import { isAuthenticated } from "../Middlewares/auth.js";
import {createCheckoutSession,getSubscriptionPurchaseHistory,handlePaymentProcessForMobile,checkSubscriptionStatus} from "../Controllers/subscription.controller.js";

const subscriptionRouter = express.Router();



subscriptionRouter.post('/createCheckoutSession',isAuthenticated,createCheckoutSession);
// subscriptionRouter.get('/payment-success/:session_id',isAuthenticated,handlePaymentSuccess)
// subscriptionRouter.post('/webhook',isAuthenticated,handlePaymentSuccess)
subscriptionRouter.get('/checkSubscriptionStatus',isAuthenticated,checkSubscriptionStatus)
subscriptionRouter.get('/getSubscriptionHistory',isAuthenticated,getSubscriptionPurchaseHistory)
subscriptionRouter.post('/handlePaymentProcessForMobile',isAuthenticated,handlePaymentProcessForMobile)

export default subscriptionRouter