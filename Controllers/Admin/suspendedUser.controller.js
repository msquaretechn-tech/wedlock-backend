import SuspendedUser from "../../Models/Admin/suspended.user.js";
import User from "../../Models/user.js";
import personalDetails from "../../Models/personalDetails.model.js";
import { Sequelize } from "sequelize";
import Op from "sequelize";
import { catchAsyncError } from "../../Middlewares/catchAsyncError.js";
import errorhandler from "../../Utils/errorhandler.js";
import sendEmail from "../../Utils/sendMail.js";
import sendAdminInfoEmail from "../../Utils/adminSendMail.js";
export const getAllSuspendedUsers = async (req, res) => {
  try {
    const suspendedUsers = await SuspendedUser.findAll({
      include: [
        {
          model: User,
          attributes: ['userId', 'email', 'isVerified', 'createdAt'],
          include: [
            {
              model: personalDetails,
              attributes: ['firstName', 'lastName', 'displayName', 'contactNumber'],
            }
          ]
        }
      ],
      order: [['suspendedAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: suspendedUsers.length,
      data: suspendedUsers,
    });
  } catch (error) {
    console.error("❌ Error fetching suspended users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// POST /suspend-user
export const suspendUser = catchAsyncError(async (req, res, next) => {
    const { userId, reason, suspendedAt, unsuspendAt } = req.body;
  
    if (!userId || !reason) {
      return next(new errorhandler("UserId and reason are required", 400));
    }
  
    const existing = await SuspendedUser.findOne({ where: { userId } });
    if (existing) {
      return res.status(200).json({
        success: false,
        message: "User is already suspended",
        suspendedData: existing,
      });
    }
  
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return next(new errorhandler("User not found", 404));
    }
  
    const newSuspension = await SuspendedUser.create({
      userId,
      reason,
      suspendedAt,
      unsuspendAt,
    });
  
    // ✅ Send suspension email
    await sendAdminInfoEmail({
      email: user.email,
      subject: "Your Account Has Been Suspended",
      template: "suspensionEmail.ejs",
      data: {
        name: user?.fullName || user?.email,
        reason,
        suspendedAt,
      },
    });
  
    return res.status(200).json({
      success: true,
      message: "User suspended and notified via email",
      data: newSuspension,
    });
  });
  
  

// DELETE /unsuspend-user/:userId
export const unsuspendUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      const deleted = await SuspendedUser.destroy({ where: { userId } });
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Suspension not found" });
      }
  
      
      await sendAdminInfoEmail({
        email: user.email,
        subject: "Your Account Has Been Reinstated",
        template: "unsuspensionEmail.ejs",
        data: {
          name: user?.fullName || user?.email,
        },
      });
  
      res.status(200).json({
        success: true,
        message: "User unsuspended and notified via email",
      });
    } catch (error) {
      console.error(" Error unsuspending user:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
