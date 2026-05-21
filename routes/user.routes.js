import express from "express";
const userRouter = express.Router();

import { registrationUser,activateUser,setPassword,checkUserSuspensionStatus,loginUser,logoutUser,forgotPassword,verifyOtp,resetPassword,activateUserForMobile ,setPasswordForMobile,verifyOtpForMobile,resetPasswordForMobile,createOrUpdateFCMToken,dummyRegister,dummyactivateUserForMobile,dummyPasswordForMobile,deleteUser, updateAccessToken,adminLogin,AllUsers,AllCustomers} from "../Controllers/user.controller.js";
import { isAuthenticated } from "../Middlewares/auth.js";


userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post('/activate-user-mobile',activateUserForMobile);
userRouter.post('/set-password-mobile',setPasswordForMobile);
userRouter.post("/set-password", setPassword);
userRouter.post("/login", loginUser);
userRouter.post('/admin-login', adminLogin)
userRouter.get('/get-All-users',isAuthenticated,AllUsers)
userRouter.get('/get-All-Customers',isAuthenticated,AllCustomers)
userRouter.get("/refresh",updateAccessToken)
userRouter.get("/logout", isAuthenticated,logoutUser);
userRouter.delete("/delete-user", isAuthenticated,deleteUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/verify-otp-for-mobile", verifyOtpForMobile);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/reset-password-for-mobile", resetPasswordForMobile);
userRouter.post("/updateFcmToken", isAuthenticated,createOrUpdateFCMToken);
userRouter.post("/dummy-register",dummyRegister);
userRouter.post("/dummy-activate-user",dummyactivateUserForMobile);
userRouter.post("/dummy-set-password",dummyPasswordForMobile);
userRouter.post("/check-user-suspension",checkUserSuspensionStatus)

export default userRouter