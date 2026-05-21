import User from "../Models/user.js";
import dotenv from 'dotenv';
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import jwt from "jsonwebtoken";
import { Op, where } from "sequelize";
import sendEmail from "../Utils/sendMail.js";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../Utils/jwt.js";
import { redis } from "../Utils/redis.js";
import Answer from '../Models/answer.model.js';
import locationDetails from "../Models/locationDetails.model.js";
import otherDetails from "../Models/otherDetails.model.js";
import personalDetails from "../Models/personalDetails.model.js";
import qualificationDetails from "../Models/qualificationDetails.model.js";
import subscription from "../Models/subscription.model.js";
import imageUpload from "../Models/imageUpload.model.js";
import recommendation from "../Models/recommendation.model.js";
import FavProfile from "../Models/favProfile.model.js";
import Subscription from "../Models/subscription.model.js";
import ToggleSection from "../Models/toggleSection.model.js";
import Connection from "../Models/connection.model.js";
import Notification from "../Models/notification.model.js";
import Call from "../Models/call.model.js";
import admin from 'firebase-admin';
import { firebaseAdmin } from "./notification.controller.js"
import { SuspendedUser } from "../Models/association.js";
dotenv.config();

// Register user
export const registrationUser = catchAsyncError(async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new errorhandler("Email is required!", 400));
        }

        const isEmailExist = await User.findOne({ where: { email } });

        if (isEmailExist) {
            return next(new errorhandler("You are already registered!", 400));
        }

        const activationToken = createActivationToken(email);
        const activationCode = activationToken.activationCode;

        const data = {
            activationCode,
            email
        };



        try {
            await sendEmail({ email, subject: "Activate Your Account", template: "activation-mail.ejs", data });

            res.status(200).json({
                success: true, message: `Please check your email: ${email} to activate your account!`,
                activationToken: activationToken.token,
            });
        } catch (error) {
            return next(new errorhandler(error.message, 500));
        }
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const createActivationToken = (email) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign({ email, activationCode }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });

    return { activationCode, token };
};

//for web app activate user
export const activateUser = catchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;

        const newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (newUser.activationCode !== activationCode) {
            return next(new errorhandler("Invalid activation code!", 400));
        }

        const token = jwt.sign({ email: newUser.email }, process.env.ACTIVATION_SECRET, { expiresIn: "5min" });

        res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });

        return res.status(200).json({ success: true, message: "OTP has been verified successfully!" });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

//for web app set password
export const setPassword = catchAsyncError(async (req, res, next) => {
    try {
        const { password, answer } = req.body;


        if (!password) {
            return next(new errorhandler("Password is required!", 400));
        }
        if (!answer) {
            return next(new errorhandler("Answer is required!", 400));
        }

        const token = req.cookies.token;

        if (!token) {
            return next(new errorhandler("Please Verify your email first!", 400));
        }

        const user = jwt.verify(token, process.env.ACTIVATION_SECRET);

        const { email } = user;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return next(
                new errorhandler(
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
                    400
                )
            );
        }

        const existingUser = await User.create({
            email,
            password,
            isVerified: true,
            otp: null
        });


        if (Array.isArray(answer)) {
            for (const ans of answer) {
                const { questionId, answerValue } = ans;


                await Answer.create({
                    userId: existingUser.userId,
                    questionId,
                    answer: answerValue
                });


            }
        }
        const recommendationData = {
            userId: existingUser.userId,
            usertype: existingUser.usertype,
            email: existingUser.email,
            gender: answer[0]?.answerValue,
            lookingFor: answer[1]?.answerValue,
            weddingGoals: answer[3]?.answerValue,
            age: answer[6]?.answerValue,
            lookingPartnerAge: answer[7]?.answerValue,
            livingInAustralia: answer[8]?.answerValue,
            horoscopeMatch: answer[9]?.answerValue,
            castReligionMatterOrNot: answer[10]?.answerValue,
            interest_and_hobbies: answer[11]?.answerValue
        };

        const toggleSections = [
            "location_details",
            "education_and_financial_details",
            "family_details",
            "religious_details",
            "personal_details",
        ];

        const toggleData = toggleSections.map(section => ({
            userId: existingUser.userId,
            section,
            status: true
        }));


        await ToggleSection.bulkCreate(toggleData, { ignoreDuplicates: true });


        await recommendation.create(recommendationData);

        res.clearCookie("token");
        sendToken(existingUser, 200, res, "Password set successfully!");

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

//for mobile app activation
export const activateUserForMobile = catchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;
        const newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (newUser.activationCode !== activationCode) {
            return next(new errorhandler("Invalid activation code!", 400));
        }
        const token = jwt.sign({ email: newUser.email }, process.env.ACTIVATION_SECRET, { expiresIn: "5min" });

        return res.status(200).json({ success: true, message: "OTP verified successfully!", token });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const setPasswordForMobile = catchAsyncError(async (req, res, next) => {
    try {
        const { password, answer, token } = req.body;

        if (!token) {
            return next(new errorhandler("Please Verify your email first!", 400));
        }

        const user = jwt.verify(token, process.env.ACTIVATION_SECRET);
        const { email } = user;


        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return next(
                new errorhandler(
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
                    400
                )
            );
        }


        const existingUser = await User.create({
            email,
            password,
            isVerified: true,
            otp: null
        });

        // Store answers in the database
        if (Array.isArray(answer)) {
            for (const ans of answer) {
                const { questionId, answerValue } = ans;


                await Answer.create({
                    userId: existingUser.userId,
                    questionId,
                    answer: answerValue
                });
            }
        }

        const recommendationData = {
            userId: existingUser.userId,
            usertype: existingUser.usertype,
            email: existingUser.email,
            gender: answer.find(a => a.questionId === 1)?.answerValue,
            lookingFor: answer.find(a => a.questionId === 2)?.answerValue,
            weddingGoals: answer.find(a => a.questionId === 4)?.answerValue,
            age: answer.find(a => a.questionId === 7)?.answerValue,
            lookingPartnerAge: answer.find(a => a.questionId === 8)?.answerValue,
            livingInAustralia: answer.find(a => a.questionId === 9)?.answerValue,
            horoscopeMatch: answer.find(a => a.questionId === 10)?.answerValue,
            castReligionMatterOrNot: answer.find(a => a.questionId === 11)?.answerValue,
            interest_and_hobbies: answer.find(a => a.questionId === 12)?.answerValue
        };


        const toggleSections = [
            "location_details",
            "education_and_financial_details",
            "family_details",
            "religious_details",
            "personal_details",
        ];

        const toggleData = toggleSections.map(section => ({
            userId: existingUser.userId,
            section,
            status: true
        }));


        await ToggleSection.bulkCreate(toggleData, { ignoreDuplicates: true });



        const existingRecommendation = await recommendation.findOne({ where: { userId: existingUser.userId } });

        if (existingRecommendation) {
            await recommendation.update(recommendationData, { where: { userId: existingUser.userId } });
        } else {
            await recommendation.create(recommendationData);
        }

        sendToken(existingUser, 200, res, "Password set successfully!");

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const loginUser = catchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new errorhandler("You are not registered!", 400));
        }
        if (!email || !password) {
            return next(new errorhandler("Please enter email and password!", 400));
        }

        const isPasswordMatched = await user.validPassword(password);

        if (!isPasswordMatched) {
            return next(new errorhandler("Invalid email or password!", 400));
        }

        // const userData = {
        //     userid: user.userId,
        //     email: user.email,
        //     usertype: user.usertype,
        //     role: user.role,
        //     isVerified: user.isVerified
        // }
        sendToken(user, 200, res, "Login successfull!");
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});






// export const loginUser = catchAsyncError(async (req, res, next) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return next(new errorhandler("Please enter email and password!", 400));
//         }

//         const user = await User.findOne({ where: { email } });

//         if (!user) {
//             return next(new errorhandler("You are not registered!", 400));
//         }

//         const isPasswordMatched = await user.validPassword(password);
//         if (!isPasswordMatched) {
//             return next(new errorhandler("Invalid email or password!", 400));
//         }

//         // Dynamically attach isSuspended flag (does not modify DB model)
//         const suspension = await SuspendedUser.findOne({ where: { userId: user.userId } });
//         user.dataValues.isSuspended = !!suspension;

//         sendToken(user, 200, res, "Login successful!");
//     } catch (error) {
//         return next(new errorhandler(error.message, 500));
//     }
// });

export const logoutUser = catchAsyncError(async (req, res, next) => {
    try {

        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });

        res.status(200).json({ success: true, message: "Logout successful!" });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const updateAccessToken = catchAsyncError(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token || req.headers["refresh_token"] || req.headers.authorization?.split(" ")[1];

        if (!refresh_token) {
            return next(new errorhandler("Please login to Find perfect matches", 400));
        }

        const decoded = jwt.verify(refresh_token, process.env.REFRESHTOKEN);
        const message = 'Could not refresh token';
        if (!decoded) {
            return next(new errorhandler(message, 401));
        }
        const session = await redis.get(decoded.userId);
        if (!session) {
            return next(new errorhandler(message, 401));
        }
        const user = JSON.parse(session);

        const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESSTOKEN, {
            expiresIn: "5m",
        });

        const refreshToken = jwt.sign({ userId: user.userId }, process.env.REFRESHTOKEN, {
            expiresIn: "7d",
        });
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);
        res.status(200).json({ success: true, accessToken, refreshToken });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})


//admin login
export const adminLogin = catchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new errorhandler("You are not registered!", 400));
        }

        if (!email || !password) {
            return next(new errorhandler("Please enter email and password!", 400));
        }

        if (user.role !== "admin") {
            return next(new errorhandler("You are not Authorized!", 400));
        }

        const isPasswordMatched = await user.validPassword(password);

        if (!isPasswordMatched) {
            return next(new errorhandler("Invalid email or password!", 400));
        }

        sendToken(user, 200, res, "Login successfull!");
    }
    catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})




export const forgotPassword = catchAsyncError(async (req, res, next) => {
    try {
        const { email } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return next(new errorhandler("Invalid email format!", 400));
        }


        if (!email) {
            return next(new errorhandler("Email is required!", 400));
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return next(new errorhandler("User not registered with Wedlock!", 400));
        }

        const personalData = await personalDetails.findOne({ where: { userId: user.userId } });

        if (!personalData) {
            return next(new errorhandler("User not registered with Wedlock!", 400));
        }


        const activationToken = createActivationToken(email);
        const activationCode = activationToken.activationCode;

        const data = {
            activationCode,
            email,
            name: personalData.firstName + " " + personalData.lastName
        };



        await sendEmail({ email, subject: "Reset Your Password", template: "forgotPassword-mail.ejs", data });

        res.status(200).json({
            success: true, message: `Please check your email: ${email} for a verification code!`,
            activationToken: activationToken.token,
        });
    }
    catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})

//for web app verify otp
export const verifyOtp = catchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;
        const newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (newUser.activationCode !== activationCode) {
            return next(new errorhandler("Invalid Reset code!", 400));
        }
        const token = jwt.sign({ email: newUser.email }, process.env.ACTIVATION_SECRET, { expiresIn: "5min" });

        res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });

        return res.status(200).json({ success: true, message: " OTP has been verified successfully!" });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

//for app verify otp
export const verifyOtpForMobile = catchAsyncError(async (req, res, next) => {

    try {
        const { activationToken, activationCode } = req.body;
        const newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (newUser.activationCode !== activationCode) {
            return next(new errorhandler("Invalid Reset code!", 400));
        }
        const token = jwt.sign({ email: newUser.email }, process.env.ACTIVATION_SECRET, { expiresIn: "5min" });


        return res.status(200).json({ success: true, message: "Reset OTP verified successfully!", token });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})

//for web app reset password
export const resetPassword = catchAsyncError(async (req, res, next) => {
    try {
        const { password } = req.body;

        const token = req.cookies.token;

        if (!token) {
            return next(new errorhandler("Please Verify your email first!", 400));
        }

        const verifiedUser = jwt.verify(token, process.env.ACTIVATION_SECRET);

        if (!verifiedUser) {
            return next(new errorhandler("Please Verify your email first!", 400));
        }


        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return next(
                new errorhandler(
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
                    400
                )
            );
        }



        const user = await User.findOne({ where: { email: verifiedUser.email } });
        const firebaseUser = await admin.auth().getUserByEmail(user.email);
        await admin.auth().updateUser(firebaseUser.uid, { password });



        user.password = password;

        const updatedUser = await user.save();

        res.clearCookie("token");
        sendToken(updatedUser, 200, res, "Password changed successfully!");
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})

//for app reset password
export const resetPasswordForMobile = catchAsyncError(async (req, res, next) => {
    try {
        const { password, token } = req.body;

        if (!token) {
            return next(new errorhandler("Please Verify your email first!", 400));
        }

        const verifiedUser = jwt.verify(token, process.env.ACTIVATION_SECRET);

        if (!verifiedUser) {
            return next(new errorhandler("Please Verify your email first!", 400));

        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return next(
                new errorhandler(
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
                    400
                )
            );
        }
        const user = await User.findOne({ where: { email: verifiedUser.email } });


        // Update password in Firebase Authentication
        const firebaseUser = await admin.auth().getUserByEmail(user.email);
        await admin.auth().updateUser(firebaseUser.uid, { password });

        // Update password in your backend database
        await user.save();




        user.password = password;

        const updatedUser = await user.save();

        sendToken(updatedUser, 200, res, "Password changed successfully!");
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})

export const createOrUpdateFCMToken = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { fcmToken, uid, userStatus } = req.body;


        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token is required.' });
        }
        if (!uid) {
            return res.status(400).json({ error: 'UID is required.' });
        }
        if (!userStatus) {
            return res.status(400).json({ error: 'User status is required.' });
        }

        let user = await User.findOne({ where: { userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        await user.update({ fcmToken, uid, userStatus });

        await recommendation.update({ fcmToken, uid, userStatus }, { where: { userId } });

        res.status(200).json({
            success: true,
            message: "FCM token updated successfully",
            user,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const user = await User.findOne({ where: { userId } });
        if (!user) {
            return next(new errorhandler("User not found!", 404));
        }
        // Delete dependent records first
        await Promise.all([
            Subscription.destroy({ where: { userId } }),
            Answer.destroy({ where: { userId } }),
            locationDetails.destroy({ where: { userId } }),
            FavProfile.destroy({ where: { userId } }),
            otherDetails.destroy({ where: { userId } }),
            personalDetails.destroy({ where: { userId } }),
            qualificationDetails.destroy({ where: { userId } }),
            imageUpload.destroy({ where: { userId } }),
            recommendation.destroy({ where: { userId } }),
            Call.destroy({ where: { userId } }),
            ToggleSection.destroy({ where: { userId } }),
            Notification.destroy({ where: { userId } }),
            Connection.destroy({ where: { [Op.or]: [{ receiverId: userId }, { senderId: userId }] } }),
        ]);

        // Delete user last
        await User.destroy({ where: { userId } });

        // Send response immediately
        res.status(200).json({ success: true, message: "Your account deleted successfully!" });

        // Remove from Redis (asynchronously)
        redis.del(userId);

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});


export const dummyRegister = catchAsyncError(async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new errorhandler("Email is required!", 400));
        }

        const isEmailExist = await User.findOne({ where: { email } });

        if (isEmailExist) {
            return next(new errorhandler("You are already registered!", 400));
        }

        const activationToken = createActivationToken(email);
        const activationCode = activationToken.activationCode;



        const data = {
            activationCode,
            email
        };


        try {
            res.status(200).json({
                success: true, message: `Please check your email: ${email} to activate your account!`,
                activationToken: activationToken.token,
            });
        } catch (error) {
            return next(new errorhandler(error.message, 500));
        }
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const dummyactivateUserForMobile = catchAsyncError(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;

        // if (newUser.activationCode !== activationCode) {
        //     return next(new errorhandler("Invalid activation code!", 400));
        // }
        const token = jwt.sign({ email: newUser.email }, process.env.ACTIVATION_SECRET, { expiresIn: "5min" });

        return res.status(200).json({ success: true, message: "Otp verified successfully!", token });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const dummyPasswordForMobile = catchAsyncError(async (req, res, next) => {
    try {
        const { password, answer, token } = req.body;

        const user = jwt.verify(token, process.env.ACTIVATION_SECRET);
        const { email } = user;

        if (password.length < 8) {
            return next(new errorhandler("Password must be at least 8 characters!", 400));
        }

        const existingUser = await User.create({
            email,
            password,
            isVerified: true,
            otp: null
        });

        if (Array.isArray(answer)) {
            for (const ans of answer) {
                const { questionId, answerValue } = ans;

                await Answer.create({
                    userId: existingUser.userId,
                    questionId,
                    answer: answerValue
                });
            }
        }

        sendToken(existingUser, 200, res, "Password set successfully!");

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});


//for admin
export const AllUsers = catchAsyncError(async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;  // Get the current user's ID

        const users = await User.findAll({
            where: {
                userId: { [Op.ne]: currentUserId }  // Exclude the current user
            },
            order: [["createdAt", "DESC"]],
        });

        if (!users) {
            return next(new errorhandler("Users not found!", 404));
        }

        const data = await Promise.all(users.map(async (user) => {
            const personalData = await personalDetails.findOne({ where: { userId: user.userId } });
            const imageUploadData = await imageUpload.findOne({ where: { userId: user.userId } }) || "";
            const image = imageUploadData.image && imageUploadData.image.length > 0 ? imageUploadData.image[0] : "";


            const displayName = personalData
                ? personalData.displayName || `${personalData.firstName} ${personalData.lastName}`
                : "Unknown User";

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                plan: user.usertype,
                displayName: displayName,
                userAvatar: image
            };
        }));


        res.status(200).json({
            success: true,
            users: data,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});


export const AllCustomers = catchAsyncError(async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;  // Get the current user's 

        const users = await User.findAll({
            where: {
                userId: { [Op.ne]: currentUserId }  // Exclude the current user
            },
            order: [["createdAt", "DESC"]],
        });

        if (!users) {
            return next(new errorhandler("Customers not found!", 404));
        }

        const data = await Promise.all(users.map(async (user) => {
            const personalData = await personalDetails.findOne({ where: { userId: user.userId } });
            const imageUploadData = await imageUpload.findOne({ where: { userId: user.userId } }) || "";
            const image = imageUploadData.image && imageUploadData.image.length > 0 ? imageUploadData.image[0] : "";
            const date = user.createdAt.toISOString().split('T')[0];


            const displayName = personalData
                ? personalData.displayName || `${personalData.firstName} ${personalData.lastName}`
                : "Unknown User";

            return {
                id: user.id,
                email: user.email,
                displayName: displayName,
                userAvatar: image,
                date: date

            };
        }));


        res.status(200).json({
            success: true,
            customers: data,
        });

    }

    catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})



export const checkUserSuspensionStatus = catchAsyncError(async (req, res, next) => {
    const userId = String(req.body.userId);


    if (!userId) {
        return next(new errorhandler("userId is required in body", 400));
    }
    console.log("Received userId:", userId, "Type:", typeof userId);

    const suspensionRecord = await SuspendedUser.findOne({
        where: { userId },
        include: [
          {
            model: User,
            attributes: ['userId', 'email', 'usertype', 'role'],
            include: [
              {
                model: imageUpload,
                attributes: ['image'],
                as: 'imageUpload' // removed limit
              }
            ]
          },
          {
            model: personalDetails,
            attributes: ['firstName', 'lastName', 'displayName', 'aboutYourSelf']
          }
        ]
    });

    if (!suspensionRecord) {
        return res.status(200).json({
            success: true,
            isSuspended: false,
            message: "User is not suspended."
        });
    }

    const user = suspensionRecord.User || {};
    const personal = suspensionRecord.personalDetail || {};
    const images = user.imageUpload?.map(img => img.image) || [];

    return res.status(200).json({
        success: true,
        isSuspended: true,
        suspendedAt: suspensionRecord.suspendedAt,
        unsuspendAt: suspensionRecord.unsuspendAt,
        reason: suspensionRecord.reason || "Not specified",
        userDetails: {
            userId: user.userId,
            email: user.email,
            usertype: user.usertype,
            role: user.role,
            displayName: personal.displayName,
            aboutYourSelf: personal.aboutYourSelf,
            profileImage: images[0] || null
        }
    });
});
