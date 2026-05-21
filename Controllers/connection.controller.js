import { Op } from "sequelize";
import Connection from "../Models/connection.model.js";
import errorhandler from "../Utils/errorhandler.js";
import User from "../Models/user.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import Notification from "../Models/notification.model.js";
import personalDetails from "../Models/personalDetails.model.js";
import imageUpload from "../Models/imageUpload.model.js";
import {getSocketInstance} from '../config/socketConfig.js'


export const sendConnectionRequest = catchAsyncError(async (req, res, next) => {
    try {
        const senderId = req.user.userId;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Receiver ID is required!" });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: "You can't connect with yourself!" });
        }

        const existingConnection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (existingConnection) {
            if (existingConnection.status === "accepted") {
                return res.status(400).json({ success: false, message: "You are already connected!" });
            }
            if (existingConnection.status === "pending") {
                return res.status(400).json({ success: false, message: "Connection request is already pending!" });
            }
        }

        const personalDetailsData = await personalDetails.findOne({ where: { userId: senderId } });
        const imageUploadData = await imageUpload.findOne({ where: { userId: senderId } });

        if (!personalDetailsData) {
            return res.status(404).json({ success: false, message: "Sender's personal details not found!" });
        }

        const connection = await Connection.create({ senderId, receiverId, status: "pending" });

        const notification = await Notification.create({
            userId: receiverId,
            title: "Connection Request",
            message: `${personalDetailsData.firstName} ${personalDetailsData.lastName} has sent you a connection request.`,
            body: {
                type: "connection_request",
                senderId,
                senderName: `${personalDetailsData.firstName} ${personalDetailsData.lastName}`,
                senderImage: imageUploadData?.image?.[0] || null
            }
        });

        const io = getSocketInstance();

        io.to(receiverId).emit("connection_request", {
            notificationId: notification.notificationId,
            title: notification.title,
            message: notification.message,
            body: {
                type: notification.body.type,
                senderId:notification.body.senderId,
                senderName:notification.body.senderName, 
                senderImage:notification.body.senderImage
            }
        }); 


        io.to(receiverId).emit("connection_Status", {
            connection_status: "pending",
            connectionType:"receiver"
        })


        
        io.to(senderId).emit("connection_Status", {
            connection_status: "pending",
            connectionType:"sender"
        })



        return res.status(201).json({
            success: true,
            message: "Connection request sent successfully!",
            data: connection
        });

    } catch (error) { 
        return next(new errorhandler(error.message, 500));
    }
});

export const  cancelConnectionRequest = catchAsyncError(async (req, res, next) => {
    try {

        const senderId = req.user.userId;
        const { receiverId } = req.body;

        if (senderId === receiverId) {
            return res.json({ success: false, message: "You can't cancel connection request with yourself!" });
        }


        const connection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection request not found!" });
        }

        if (connection.status === 'accepted') {
            return res.status(400).json({ success: false, message: "Connection request already accepted!" });
        }

        await connection.destroy();


        const io = getSocketInstance();



        io.to(receiverId).emit("connection_Status", {
            connection_status: "no connection",
            connectionType:"none"
        })
        io.to(senderId).emit("connection_Status", {
            connection_status: "no connection",
            connectionType:"none"
        })




        return res.status(200).json({ success: true, message: "Connection cancelled successfully!" });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const removeConnection = catchAsyncError(async (req, res, next) => {
    try {
        const senderId = req.user.userId;
        const { receiverId } = req.body;


        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: "You can't remove connection with yourself!" });
        }

        const connection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });


        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection not found!" });
        }

        await connection.destroy();

        const io = getSocketInstance();

        io.to(receiverId).emit("connection_Status", {
            connection_status: "no connection",
            connectionType:"none"
        })
        io.to(senderId).emit("connection_Status", {
            connection_status: "no connection",
            connectionType:"none"
        })


        return res.status(200).json({ success: true, message: "Connection removed successfully!" });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const acceptConnectionRequest = catchAsyncError(async (req, res, next) => {
    try {
        const receiverId = req.user.userId;
        const { senderId } = req.body;

        if (receiverId === senderId) {
            return res.status(400).json({ success: false, message: "You can't accept your own connection request!" });
        }

        const connection = await Connection.findOne({
            where: {
                senderId: senderId,
                receiverId: receiverId,
                status: 'pending'
            }
        });

        const personalDetailsData = await personalDetails.findOne({ where: { userId: receiverId } });
        const imageUploadData = await imageUpload.findOne({ where: { userId: receiverId } });


        if (!connection) {
            return next(new errorhandler("Connection request not found!", 404));
        }

        if (connection.status === 'accepted') {
            return res.status(400).json({ success: false, message: "Connection request already accepted!" });
        }

        connection.status = 'accepted';
        await connection.save();


        const notification = await Notification.create({
            userId: senderId,
            title: "Connection Accepted",
            message: `${personalDetailsData.firstName} ${personalDetailsData.lastName} has accepted your connection request.`,
            body: {
                type: "connection_accepted",
                senderId,
                senderName: `${personalDetailsData.firstName} ${personalDetailsData.lastName}`,
                senderImage: imageUploadData?.image?.[0] || null
            }
        });


         const io = getSocketInstance();

          io.to(senderId).emit("connection_request", {
            notificationId: notification.notificationId,
            title: notification.title,
            message: notification.message,
            body: {
                type: notification.body.type,
                senderId:notification.body.senderId,
                senderName:notification.body.senderName,
                senderImage:notification.body.senderImage
            }
        });




        io.to(receiverId).emit("connection_Status", {
            connection_status: "accepted",
            connectionType:"receiver"
        })
        io.to(senderId).emit("connection_Status", {
            connection_status: "accepted",
            connectionType:"sender"
        })



        return res.status(200).json({ success: true, message: "Connection request accepted successfully!" });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const rejectConnectionRequest = catchAsyncError(async (req, res, next) => {
    try {
        const receiverId = req.user.userId;
        const { senderId } = req.body;

        if (receiverId === senderId) {
            return res.status(400).json({ success: false, message: "You can't reject your own connection request!" });
        }

        const connection = await Connection.findOne({
            where: {
                senderId: senderId,
                receiverId: receiverId,
                status: 'pending'
            }
        });

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection request not found!" });
        }


        if (connection.status === 'accepted') {
            return res.status(400).json({ success: false, message: "Connection request already accepted!" });
        }

        await connection.destroy();

        return res.status(200).json({ success: true, message: "Connection request rejected successfully!" });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const getConnectionStatus = catchAsyncError(async (req, res, next) => {

    try{

        const connectedUserId = req.user.userId

        const { userId } = req.body;


        const connectionStatus = await Connection.findOne({
            where: {
              [Op.or]: [
                { senderId: connectedUserId, receiverId: userId }, 
                { receiverId: connectedUserId, senderId: userId } 
              ]
            }
          });

          const connection_status = (() => {
            if (connectionStatus) {
                if (connectionStatus.status === 'cancelled' || connectionStatus.status === 'rejected') {
                    return 'no connection';  
                }
                return connectionStatus.status;  
            }
            return 'no connection';
            })();
        
            const isSender = connectionStatus && connectionStatus.senderId === connectedUserId; // user2 sent the request
            const isReceiver = connectionStatus && connectionStatus.receiverId === connectedUserId; // user2 received the request
        
        const connectionType = (() => {
            if (isSender) {
                return 'sender';
            } else if (isReceiver) {
                return 'receiver';
            } else {
                return 'none';
            }
        })(); 
        
        const data = {
            connection_status,
            connectionType
        }


        return res.status(200).json({ success: true, data,message: "Connection status fetched successfully!" });
      

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }


})

export const getMyConnections = catchAsyncError(async (req, res, next) => {
    try {
      const userId = req.user.userId;
  
  
      const connections = await Connection.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId },
          ],
          status: 'accepted',
        },
      });

  
     

      const connectionData = connections.map((connection) => {
        if (connection.senderId === userId) {
          return { userId: connection.receiverId };
        } else if (connection.receiverId === userId) {
          return { userId: connection.senderId };
        }
      });
  
      return res.status(200).json({ success: true, data: connectionData ,message: "Connections fetched successfully!" });
    } catch (error) {
      return next(new errorhandler(error.message, 500));
    }
});


