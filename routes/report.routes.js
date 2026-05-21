 import express from 'express';
import { reportUser, getMyReports, getAllReports } from '../Controllers/report.controller.js';
import { isAuthenticated } from '../Middlewares/auth.js';

const ReportRouter = express.Router();

ReportRouter.post('/report', isAuthenticated, reportUser);
ReportRouter.get('/my-reports', isAuthenticated, getMyReports);
ReportRouter.get('/all', isAuthenticated, getAllReports); // for admin

export default ReportRouter;