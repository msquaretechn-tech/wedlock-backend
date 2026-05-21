import { uploadCloudinary, deleteCloudinary } from '../../Utils/cloudinary.js';

import errorhandler from '../../Utils/errorhandler.js';
import { catchAsyncError } from '../../Middlewares/catchAsyncError.js';
import connectDB from '../../Utils/db.js';
import { Op, where } from 'sequelize';
import sendEmail from '../../Utils/sendMail.js';
import sendAdminInfoEmail from '../../Utils/adminSendMail.js';
import {
  User,
  personalDetails,
  otherDetails,
  locationDetails,
  imageUpload,
  qualificationDetails,
  FavProfile,
  happyStories,
  Connection,
  Subscription,
  Notification,
  ToggleSection,
  Recommendation,
  SuspendedUser

} from '../../Models/association.js';
import { suspendUser } from './suspendedUser.controller.js';

const sequelize = connectDB();


export const deleteUserAccount = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;

  const transaction = await sequelize.transaction();

  try {
   
    await Promise.all([
      SuspendedUser.destroy({where:{userId},transaction}),
      personalDetails.destroy({ where: { userId }, transaction }),
      otherDetails.destroy({ where: { userId }, transaction }),
      locationDetails.destroy({ where: { userId }, transaction }),
      imageUpload.destroy({ where: { userId }, transaction }),
      qualificationDetails.destroy({ where: { userId }, transaction }),

      FavProfile.destroy({
        where: {
          [Op.or]: [
            { userId }, 
            { favoritedUserId: userId }
          ]
        },
        transaction
      }),
      happyStories.destroy({ where: { userId }, transaction }),
      Connection.destroy({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        transaction
      }),
      Subscription.destroy({ where: { userId }, transaction }),
      Notification.destroy({ where: { userId }, transaction }),
      ToggleSection.destroy({ where: { userId }, transaction }),
      Recommendation.destroy({ where: { userId }, transaction }),
    ]);

    


    await User.destroy({ where: { userId }, transaction });


    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "User account and all associated data deleted successfully"
    });

  } catch (error) {

    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Delete user error:", error);
    return next(new errorhandler("Failed to delete user account", 500));
  }
});




export const sendAdminEmail = catchAsyncError(async (req, res, next) => {
  const { emails, subject, data } = req.body;
  const template =  "adminMessage.ejs"

  if (!emails || !subject || !template) {
    return next(new errorhandler('Emails, subject, and template are required', 400));
  }

  const recipientList = Array.isArray(emails) ? emails : [emails];

  for (const email of recipientList) {
    await sendAdminInfoEmail({ email, subject, template, data });
  }

  res.status(200).json({
    success: true,
    message: `Emails successfully sent to ${recipientList.length} recipient(s).`,
  });
});





export const deleteAboutAndImages = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
      return res.status(400).json({
          success: false,
          message: "userId is required in the request body.",
      });
  }

  try {
      // Check for personalDetails
      const personal = await personalDetails.findOne({ where: { userId } });
      if (!personal) {
          return res.status(404).json({ success: false, message: "Personal details not found!" });
      }

      // Clear aboutYourSelf in both tables
      await personalDetails.update({ aboutYourSelf: '' }, { where: { userId } });
      await Recommendation.update({ aboutYourSelf: '' }, { where: { userId } });

      // Clear image array in both tables
      const imageUploadExist = await imageUpload.findOne({ where: { userId } });

      if (imageUploadExist) {
          await imageUpload.update({ image: [] }, { where: { userId } });
          await Recommendation.update({ image: [] }, { where: { userId } });
      }

      return res.status(200).json({
          success: true,
          message: "About yourself and images deleted successfully.",
      });

  } catch (err) {
      return next(new errorhandler(err.message, 500));
  }
});