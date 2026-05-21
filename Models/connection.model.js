import { DataTypes } from "sequelize";
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from "./user.js";
import { v4 as uuidv4 } from 'uuid';
dotenv.config(); 

const sequelize = connectDB();

const Connection = sequelize.define('Connection', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },

    connectionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
    },

    senderId: { // Changed from user1 to senderId
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },

    receiverId: { // Changed from user2 to receiverId
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },

    status: {
        type: DataTypes.ENUM('accepted', 'rejected', 'pending', 'cancelled'),
        defaultValue: 'pending',
    },
}, {
    timestamps: true
});

export default Connection;
