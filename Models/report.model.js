import { DataTypes } from 'sequelize';
import connectDB from '../Utils/db.js';

const sequelize = connectDB();

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    reporterUserId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    reportedUserId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    reason: {
        type: DataTypes.JSON,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'reports'
});

export default Report;