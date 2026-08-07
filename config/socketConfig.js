import { Server, Socket } from 'socket.io';
import jwt from "jsonwebtoken";
import Notification from '../Models/notification.model.js';

// Declare a variable to hold the io instance
let io;

export const intializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["https://wedlock.com.au", "https://admin.wedlock.com.au", 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
            methods: ["GET", "POST"],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            next(new Error("Authentication Error"));
        }

        try {
            const decodeToken = jwt.verify(token, process.env.ACCESSTOKEN);
            socket.data.userId = decodeToken.userId;
            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.data.userId}`);

        socket.join(socket.data.userId);

        socket.on("notifyUser", async (notification) => {
            try {
                const newNotification = await Notification.create(notification);
                io.emit("notifyUser", newNotification);
            } catch (error) {
                console.log(error);
            }
        });

        socket.on("sendFriendRequest", (data) => {
            io.emit("sendFriendRequest", data);
        });

        // Real-time Zego Calling events
        socket.on("zego_call_user", (data) => {
            const { targetUserId, roomID, callType, callerInfo } = data;
            io.to(targetUserId).emit("zego_incoming_call", {
                callerId: socket.data.userId,
                callerInfo,
                roomID,
                callType
            });
        });

        socket.on("zego_accept_call", (data) => {
            const { callerId, roomID } = data;
            io.to(callerId).emit("zego_call_accepted", {
                acceptorId: socket.data.userId,
                roomID
            });
        });

        socket.on("zego_reject_call", (data) => {
            const { callerId, reason } = data;
            io.to(callerId).emit("zego_call_rejected", {
                rejectorId: socket.data.userId,
                reason: reason || "User rejected the call"
            });
        });

        socket.on("zego_end_call", (data) => {
            const { targetUserId } = data;
            io.to(targetUserId).emit("zego_call_ended", {
                endedBy: socket.data.userId
            });
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.data.userId}`);
        });
    });

    return io;
};


    

// Export the io instance for reuse
export const getSocketInstance = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized. Please call initializeSocket first.");
    }
    return io;
};
