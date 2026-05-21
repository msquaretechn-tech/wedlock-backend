import express from 'express';



import { getAllSuspendedUsers,suspendUser,unsuspendUser } from '../../Controllers/Admin/suspendedUser.controller.js';
import { isAdminAuthenticated } from '../../Middlewares/Admin/isAdminAuthenticated.js';
isAdminAuthenticated
const AdminSuspendUser = express.Router();

AdminSuspendUser.get('/suspended-users',getAllSuspendedUsers);         // GET all suspended
AdminSuspendUser.post('/suspend-user', isAdminAuthenticated,suspendUser);                   // POST to suspend
AdminSuspendUser.delete('/unsuspend-user',isAdminAuthenticated, unsuspendUser);     // DELETE to unsuspend

export default AdminSuspendUser;
