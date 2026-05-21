import express from "express";
import { 
    getAllUsersWithDetails,
    getUserStatus 
} from "../../Controllers/Admin/admin-user-details.controller.js";
import { isAdminAuthenticated } from "../../Middlewares/Admin/isAdminAuthenticated.js";

const AdminUserRouter = express.Router();


AdminUserRouter.get("/all-users", isAdminAuthenticated, getAllUsersWithDetails);


AdminUserRouter.get('/user-status', isAdminAuthenticated, getUserStatus);

export default AdminUserRouter;