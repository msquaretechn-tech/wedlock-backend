import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();


const otherDetails = sequelize.define('otherDetails', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },

    userId: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },
    caste:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    community: {
        type: DataTypes.STRING,
        allowNull: false,
        
    },
    subCommunity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    dateOfBirth:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    timeOfBirth:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    religion:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    placeOfBirth:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    gotra:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },  
    motherTongue:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    height: {
        type: DataTypes.STRING,
        allowNull:true,
        defaultValue:"Not Specified"

    },
    weight:{
        type: DataTypes.STRING,
        allowNull:true,
        defaultValue:"Not Specified"
    },
    bodyType:{
        type: DataTypes.STRING,
        allowNull:true,
        defaultValue:"Not Specified"

    },
    language: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    smokingHabbit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    drinkingHabbit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    diet: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    complexion: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"

    },
    fatherOccupation: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    motherOccupation: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    numberOfSiblings: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
    livingWithFamily: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"Not Specified"
    },
   
});

export default otherDetails;