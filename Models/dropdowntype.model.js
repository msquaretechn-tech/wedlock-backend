import { DataTypes } from 'sequelize';
import connectDB from '../Utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = connectDB();


const dropDownType = sequelize.define('dropDownType', {
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
    },
    dropDownTypeId: {
         type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    dropdownType: {
        type: DataTypes.STRING,
        allowNull: false,
    },

}, {
    timestamps: true
});


export default dropDownType;