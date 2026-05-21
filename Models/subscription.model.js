import { DataTypes } from "sequelize";
import connectDB from "../Utils/db.js";
import { v4 as uuidv4 } from "uuid";
import User from "./user.js";
import plan from "./plan.model.js";

const sequelize = connectDB();

const Subscription = sequelize.define('subscription', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId',
        },
    },
    planId: {
        type:DataTypes.UUID,
        allowNull: true,
        references: {
            model: plan,
            key: 'planId',
        },
    },
    paymentSucessId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deviceType: {
        type: DataTypes.STRING,
        allowNull: false,
        enum : ["Web", "Mobile"],
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive", "Expired", "Cancelled"),
        allowNull: false,
        defaultValue: "Active",
    },
    paymentStatus: {
        type: DataTypes.ENUM("Pending", "Completed", "Failed"),
        allowNull: false,
        defaultValue: "Pending",
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
});



export default Subscription;
