import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';

dotenv.config();

const sequelize = connectDB();

const UserConsentLog = sequelize.define('UserConsentLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
    noticeVersion: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'v1.0',
    },
    dateAndTimeShown: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    ageGatePassed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    consentTermsAndAge: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    consentSensitiveInfo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    marketingConsent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    marketingNoticeVersion: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'mkt-v1.0',
    },
}, {
    timestamps: true,
});

export default UserConsentLog;
