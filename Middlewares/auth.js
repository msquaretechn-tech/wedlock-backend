import { redis } from "../Utils/redis.js";
import { catchAsyncError } from "./catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import jwt from "jsonwebtoken";

//authenticated user

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const rawToken = req.cookies?.access_token || req.header("Authorization");
    
    if (!rawToken) {
        return next(new errorhandler("Please login to Find perfect matches", 400));
    }

    // Strip "Bearer " prefix if present (from Authorization header)
    const accessToken = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

    const decoded = jwt.verify(accessToken, process.env.ACCESSTOKEN);

    if(!decoded){
        return next(new errorhandler("access token is not valid", 400));
    }

    const user = await redis.get(decoded.userId);

    if(!user){ 
        return next(new errorhandler("User not found", 400));
    }
    req.user = JSON.parse(user);
    next();
}) 