import { 
    deleteUserAccount, 
   sendAdminEmail,deleteAboutAndImages
  } from "../../Controllers/Admin/admin-contorl-over-user-controlller.js";
  import express from "express";
import { isAdminAuthenticated } from "../../Middlewares/Admin/isAdminAuthenticated.js";// Assuming you have admin verification middleware
  
  const adminControlOverUserRouter = express.Router();
  
  // Delete user account completely
  adminControlOverUserRouter.delete(
    '/delete-user',
  isAdminAuthenticated,
    deleteUserAccount
  );
  



  adminControlOverUserRouter.delete(
    '/delete-image-about',
  isAdminAuthenticated,
     deleteAboutAndImages
  );
    // Delete user account completely
    adminControlOverUserRouter.post(
      '/send-email',
       isAdminAuthenticated,
      sendAdminEmail
    );
 
  
  export default adminControlOverUserRouter;