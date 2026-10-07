import express from "express";
import { recordUserConsent, getUserConsentLog, verifyAgeGate } from "../Controllers/consent.controller.js";
import { isAuthenticatedUser } from "../Middlewares/auth.js";

const consentRouter = express.Router();

// Public age gate pre-check endpoint (no storage)
consentRouter.post("/verify-age", verifyAgeGate);

// Record consent endpoint (can be called during or after signup)
consentRouter.post("/record", recordUserConsent);

// Fetch single user consent audit log
consentRouter.get("/audit/:userId", getUserConsentLog);

export default consentRouter;
