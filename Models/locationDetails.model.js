import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();

const locationDetails = sequelize.define('locationDetails', {
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
    citizenShip: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    country:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    state:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    austrailanVisaStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    currentLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    cityOfResidence: {
        type: DataTypes.STRING,
        allowNull:true,
        defaultValue:"Not Specified"
    },
    nationality:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    residencyVisaStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    
})


export default locationDetails
