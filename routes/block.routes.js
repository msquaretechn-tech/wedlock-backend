import express from 'express';
import { blockUser, unblockUser, getBlockedList,getMyBlockedUsersDetails } from '../Controllers/block.controller.js';
import { isAuthenticated } from '../Middlewares/auth.js';

const BlockRouter = express.Router();

BlockRouter.post('/block', isAuthenticated, blockUser);
BlockRouter.post('/unblock', isAuthenticated, unblockUser);
BlockRouter.get('/blocked', isAuthenticated, getBlockedList);
BlockRouter.get('/blocked-by-me', isAuthenticated, getMyBlockedUsersDetails);

export default BlockRouter;