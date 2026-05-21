import { Server, Socket } from 'socket.io';
import jwt from "jsonwebtoken";
import Notification from '../Models/notification.model.js';

// Declare a variable to hold the io instance
let io;

export const intializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["https://wedlock.au", "https://admin.wedlock.au", 'http://localhost:5173', 'http://localhost:5176'],
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
