import express from "express";
import { isAuthenticated } from "../Middlewares/auth.js";
import { getBillingInfo } from "../Controllers/billings.controller.js";


const billingRouter = express.Router();

billingRouter.get('/getBillingInfo',isAuthenticated,getBillingInfo);

export default billingRouter