import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();


const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },

    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },
    notificationId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    body : {
        type: DataTypes.JSON,
        allowNull: true
    },
    
    readStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
});

export default Notification;
    