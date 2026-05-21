import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();


const personalDetails  = sequelize.define('personalDetails', {

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

    firstName: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contactNumber:{
        type: DataTypes.STRING,
        allowNull: false,
        min: 10,
        max: 10
    },
    maritalStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    numberOfChildren: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    aboutYourSelf: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    
  

});

export default personalDetails;