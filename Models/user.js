import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
import jwt from 'jsonwebtoken';


dotenv.config();

import bcrypt from 'bcryptjs';
import plan from './plan.model.js';

const sequelize = connectDB();

const emailRegexPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const User = sequelize.define('User', {
   
    uid : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },

    fcmToken: {
        type: DataTypes.STRING,
        allowNull: true,
   },
    userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // Corrected UUID generation
        allowNull: false,
        unique: true,
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: plan,
            key: 'planId',
        },
    
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: emailRegexPattern,
            notEmpty: true,
        },
    },
    otp:{
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [8, 255],
        },
    },
    usertype: {
        type: DataTypes.ENUM('Exclusive', 'Standard','Premium'),
        allowNull: false,
        defaultValue: 'Standard',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isPersonalFormFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isQualificationFormFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isLocationFormFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isOtherFormFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isImageFormFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
   
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
    },


}, {
    timestamps: true,
});

// Hash password before creating or updating user
User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

//signed access token
User.prototype.signAccessToken = function () {
    return jwt.sign({ userId: this.userId }, process.env.ACCESSTOKEN|| '');
};

//signed refresh token
User.prototype.signRefreshToken = function () {
    return jwt.sign({ userId: this.userId }, process.env.REFRESHTOKEN|| '');
};

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

// Compare password
User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};



// const syncDB = async () => {
//     try {
//         await sequelize.sync({ alter: true }); // Use `alter: true` to avoid data loss
//         console.log('Database synced successfully'); 
//     } catch (error) {
//         console.error('Error syncing database:', error);
//     }
// };


// syncDB();





export default User;
