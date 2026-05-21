import { DataTypes } from "sequelize";
import connectDB from "../Utils/db.js";

const sequelize = connectDB();

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },

  question: {
    type: DataTypes.STRING,
    allowNull: true,
  },

});

await sequelize.sync({ force: false });

export default Question;