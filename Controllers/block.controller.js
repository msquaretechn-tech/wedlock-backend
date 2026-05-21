import Block from '../Models/block.model.js';
import { catchAsyncError } from '../Middlewares/catchAsyncError.js';
import errorhandler from '../Utils/errorhandler.js';
import Connection from '../Models/connection.model.js';
import User from '../Models/user.js';
import personalDetails from '../Models/personalDetails.model.js';
import imageUpload from '../Models/imageUpload.model.js';
import { Op } from 'sequelize';
// Block a user
export const blockUser = catchAsyncError(async (req, res, next) => {
    const blockerUserId = req.user.userId;
    const { blockedUserId } = req.body;
  
    if (!blockedUserId) {
      return next(new errorhandler("Blocked user ID is required", 400));
    }
  
    const alreadyBlocked = await Block.findOne({
      where: { blockerUserId, blockedUserId },
    });
  
    if (alreadyBlocked) {
      return next(new errorhandler("User already blocked", 400));
    }
  
    
    await Connection.destroy({
      where: {
        [Op.or]: [
          { senderId: blockerUserId, receiverId: blockedUserId },
          { senderId: blockedUserId, receiverId: blockerUserId },
        ],
      },
    });
  
   
    const block = await Block.create({ blockerUserId, blockedUserId });
  
    res.status(201).json({
      success: true,
      message: 'User blocked and connection (if existed) removed successfully.',
      data: block,
    });
  });


export const unblockUser = catchAsyncError(async (req, res, next) => {
    const blockerUserId = req.user.userId;
    const { blockedUserId } = req.body;

    const blockedEntry = await Block.findOne({ where: { blockerUserId, blockedUserId } });
    if (!blockedEntry) {
        return next(new errorhandler("User is not blocked", 404));
    }

    await blockedEntry.destroy();

    res.status(200).json({
        success: true,
        message: "User unblocked successfully",
    });
});

// Get list of blocked users
// Get list of users you blocked AND users who blocked you
export const getBlockedList = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;

    // 1. Users you have blocked
    const blocked = await Block.findAll({
        where: { blockerUserId: userId },
        attributes: ['blockedUserId'],
    });

    // 2. Users who have blocked you
    const blockedBy = await Block.findAll({
        where: { blockedUserId: userId },
        attributes: ['blockerUserId'],
    });

    res.status(200).json({
        success: true,
        message: "Blocked users fetched successfully",
        data: {
            blockedUserIds: blocked.map(entry => entry.blockedUserId),
            blockedByUserIds: blockedBy.map(entry => entry.blockerUserId),
        },
    });
});





export const getMyBlockedUsersDetails = catchAsyncError(async (req, res, next) => {
    const blockerUserId = req.user.userId;

 
    const blockedUsers = await Block.findAll({
        where: { blockerUserId },
        attributes: ['blockedUserId'],
    });

    const blockedUserIds = blockedUsers.map(entry => entry.blockedUserId);

    if (blockedUserIds.length === 0) {
        return res.status(200).json({
            success: true,
            message: "You haven't blocked any users yet.",
            data: [],
        });
    }

    const blockedUserDetails = await Promise.all(
        blockedUserIds.map(async (userId) => {
            const user = await User.findOne({ where: { userId } });
            const personal = await personalDetails.findOne({ where: { userId } });
            const imageData = await imageUpload.findOne({ where: { userId } });
            const profileImage = imageData?.image?.[0] || "";

            return {
                userId: user?.userId,
                email: user?.email,
                name: personal?.displayName || `${personal?.firstName || ''} ${personal?.lastName || ''}`.trim(),
                gender: personal?.gender || null,
                profileImage: profileImage || null,
            };
        })
    );

    res.status(200).json({
        success: true,
        message: "Blocked user details fetched successfully",
        data: blockedUserDetails,
    });
});
