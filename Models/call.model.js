import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();

const Call = sequelize.define('Call', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },
    callId: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
     userId :{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },
    callerId: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    callieId: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    recieverId: {
        type: DataTypes.UUID,
        allowNull: true,
    },

    totalCallDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

}, {
    timestamps: true
});

export default Call;

