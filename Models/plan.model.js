import { DataTypes } from "sequelize";
import connectDB from "../Utils/db.js";

const sequelize = connectDB();

const plan = sequelize.define("plan", {

  planId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  planName: {
    type: DataTypes.ENUM("Standard", "Premium", "Exclusive"),
    allowNull: true,
  },
  planType: {
    type: DataTypes.ENUM("Monthly", "Yearly"),
    allowNull: true,
  },
  featureList: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
  price: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  durationInMonths: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  stripePriceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default plan;