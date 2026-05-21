import express from 'express';
import {
  registerAdmin,
  adminLogin,
  verifyLoginOtp,
  adminLogout,
  updateAdminAccessToken,
  forgotPasswordWithOldPass,
  verifyOtpAndChangePassword
} from '../../Controllers/Admin/admin.auth.controller.js';

import { getAdminLogs, getLogsByAdminId } from '../../Controllers/Admin/admin-logs-contorl.js';
import { isAdminAuthenticated } from '../../Middlewares/Admin/isAdminAuthenticated.js';
import { logApiRequest } from '../../Middlewares/Admin/logApiRequest.js';

const adminRouter = express.Router();

// Unprotected Routes
// adminRouter.post('/register', registerAdmin);  /       
adminRouter.post('/login', adminLogin);              
adminRouter.post('/verify-otp', logApiRequest, verifyLoginOtp); 
adminRouter.get('/refresh-token', updateAdminAccessToken); 
adminRouter.post('/register', registerAdmin);   

// Password Reset Routes
adminRouter.post('/forgot-password-old', forgotPasswordWithOldPass);  // Step 1
adminRouter.post('/verify-password-otp', verifyOtpAndChangePassword); // Step 2
          // Set new password

// Protected Routes
adminRouter.post('/logout', isAdminAuthenticated, logApiRequest, adminLogout); 

// Admin Logs
adminRouter.get('/logs', getAdminLogs);             
adminRouter.get('/user-logs', getLogsByAdminId);   

export default adminRouter;