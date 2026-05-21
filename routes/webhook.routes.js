import express from "express";
import { handlePaymentSuccess } from "../Controllers/webhook.controller.js";

const webhookRouter = express.Router();

// Apply express.raw() middleware directly to the webhook route
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), handlePaymentSuccess);

export default webhookRouter;
