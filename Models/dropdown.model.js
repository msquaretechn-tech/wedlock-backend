import { DataTypes } from 'sequelize';
import connectDB from '../Utils/db.js';
import dotenv from 'dotenv';

import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const sequelize = connectDB();
import dropDownType from './dropdowntype.model.js';


const dropdown = sequelize.define('dropdown', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
    },
    dropdownId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        primaryKey: true,
        allowNull: false,
    },

    dropDownTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: dropDownType,
            key: 'dropDownTypeId',
        },
    },
    dropdownValue: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

export default dropdown;