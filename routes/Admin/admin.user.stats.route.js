import express from 'express';
import {
  getUserStatsForAdmin,
  getNewUserAdded,
  getGenderRatio,
  getProfileCompletionStats,
  getConnectionStats,
} from '../../Controllers/Admin/admin.user.stats.contorller.js';

import { isAdminAuthenticated } from '../../Middlewares/Admin/isAdminAuthenticated.js';

const adminDashboardRouter = express.Router();


adminDashboardRouter.get('/user-stats', isAdminAuthenticated, getUserStatsForAdmin);


adminDashboardRouter.get('/new-user-data', isAdminAuthenticated, getNewUserAdded);


adminDashboardRouter.get('/gender-ratio', isAdminAuthenticated, getGenderRatio);


adminDashboardRouter.get('/profile-fill-percentage', isAdminAuthenticated, getProfileCompletionStats);


adminDashboardRouter.get('/connection-data', isAdminAuthenticated, getConnectionStats);

export default adminDashboardRouter;
