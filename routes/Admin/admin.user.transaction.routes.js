import express from 'express';
import { 
  getAllBillingInfo, 
  getFinancialReport 
} from '../../Controllers/Admin/admin.user.transaction.controller.js';
import { isAdminAuthenticated } from '../../Middlewares/Admin/isAdminAuthenticated.js';

const admintransactionRouter = express.Router();

// Get all users' billing information
admintransactionRouter.get(
  "/allbillinginfo", 
  isAdminAuthenticated, 
  getAllBillingInfo
);

// Get financial reports with optional filtering and export
admintransactionRouter.get(
  "/financial-report", 
  isAdminAuthenticated, 
  getFinancialReport
);

export default admintransactionRouter;