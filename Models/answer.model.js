import { DataTypes } from 'sequelize';
import connectDB from '../Utils/db.js';
import User from './user.js'; 
import { v4 as uuidv4 } from 'uuid';

const sequelize = connectDB();

const Answer = sequelize.define('Answer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false, 
    },
    questionId: {
        type: DataTypes.INTEGER, 
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
    answer: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
});


export default Answer;
