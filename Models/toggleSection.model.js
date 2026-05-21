import { DataTypes } from "sequelize";
import connectDB from "../Utils/db.js";
import User from "./user.js";

const sequelize = connectDB();

const ToggleSection = sequelize.define(
    "toggleSection",
    {
        toggleId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Corrected UUID generation
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "userId",
            },
        },
        section: {
            type: DataTypes.STRING,
            allowNull: false,
            enum: ["location_details",
                "education_and_financial_details",
                "family_details",
                "religious_details",
                "personal_details"]
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
    }
);

export default ToggleSection;
