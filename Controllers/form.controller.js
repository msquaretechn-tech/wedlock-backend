import personalDetails from "../Models/personalDetails.model.js";
import User from "../Models/user.js";
import qualificationDetails from "../Models/qualificationDetails.model.js";
import locationDetails from "../Models/locationDetails.model.js";
import otherDetails from "../Models/otherDetails.model.js";
import imageUpload from "../Models/imageUpload.model.js";
import dotenv from 'dotenv';
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import { uploadCloudinary } from "../Utils/cloudinary.js"
import recommendation from "../Models/recommendation.model.js";
import sendEmail from "../Utils/sendMail.js";

dotenv.config();

export const personalDetailsRegister = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const { firstName, lastName, displayName, contactNumber, maritalStatus, numberOfChildren, aboutYourSelf } = req.body;

        if (!firstName || !lastName || !displayName || !contactNumber || !maritalStatus
            || !numberOfChildren || !aboutYourSelf) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }
        const personalDetailsExist = await personalDetails.findOne({ where: { userId } });

        if (personalDetailsExist) {
            return res.status(400).json({ success: false, message: "Personal details already exist!" });
        }


        const personal = await personalDetails.create({ firstName, lastName, displayName, contactNumber, maritalStatus, numberOfChildren, aboutYourSelf, userId });
        await User.update({ isPersonalFormFilled: true }, { where: { userId } });

        await recommendation.update({ firstName, lastName, displayName, contactNumber, maritalStatus, numberOfChildren, aboutYourSelf }, { where: { userId } });


        res.status(201).json({
            success: true,
            message: "Personal details added successfully",
            personal
        })
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});

export const qualificationDetailsRegister = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { qualification, currentWorkingStatus, occupation, income } = req.body;

        if (!qualification || !currentWorkingStatus || !occupation || !income) {
            return res.status(400).json({ success: false, message: "All fields are required!" });}

        const qualificationDetailsExist = await qualificationDetails.findOne({ where: { userId } });

        if (qualificationDetailsExist) {
            return res.status(400).json({ success: false, message: "Qualification details already exist!" });
        }

        const qualificationData = await qualificationDetails.create({ qualification, currentWorkingStatus, occupation, income, userId });

        await recommendation.update({ qualification, currentWorkingStatus, occupation, income }, { where: { userId } });



        await User.update({ isQualificationFormFilled: true }, { where: { userId } });


        res.status(201).json({
            success: true,
            message: "Qualification details added successfully",
            qualificationData
        })
    } catch (err) {
        return (next(errorhandler(err.message, 400)));
    }


});

export const locationDetailsRegister = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;
    const { citizenShip, country, state, austrailanVisaStatus } = req.body;

    if (!citizenShip || !country || !state || !austrailanVisaStatus) {
        return  res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const locationDetailsExist = await locationDetails.findOne({ where: { userId } });

    if (locationDetailsExist) {
        return res.status(400).json({ success: false, message: "Location details already exist!" });
    }

    const locationDetailsData = await locationDetails.create({ citizenShip, country, state, austrailanVisaStatus, userId });

    await recommendation.update({ citizenShip, country, state, austrailanVisaStatus }, { where: { userId } });

    await User.update({ isLocationFormFilled: true }, { where: { userId } });
    res.status(201).json({
        success: true,
        message: "Location details added successfully",
        locationDetailsData
    })
})

export const otherDetailsRegister = catchAsyncError(async (req, res, next) => {

    const userId = req.user.userId;
    const { caste, community, dateOfBirth, timeOfBirth, religion, placeOfBirth } = req.body;

    if (!caste || !community || !dateOfBirth || !timeOfBirth || !religion || !placeOfBirth) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const otherDetailsExist = await otherDetails.findOne({ where: { userId } });

    if (otherDetailsExist) {
        return res.status(400).json({ success: false, message: "Other details already exist!" });
    }

    const otherDetailsData = await otherDetails.create({ caste, community, dateOfBirth, timeOfBirth, religion, placeOfBirth, userId });

    await recommendation.update({ caste, community, dateOfBirth, timeOfBirth, religion, placeOfBirth }, { where: { userId } });


    await User.update({ isOtherFormFilled: true }, { where: { userId } });
    res.status(201).json({
        success: true,
        message: "Other details added successfully",
        otherDetailsData
    })
})

export const imageUploadRegister = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;
    try {
        if (!req.files) {
            return next(new errorhandler("Please upload an image!", 400));
        }

        const imageUploadExist = await imageUpload.findOne({ where: { userId } });

        if (imageUploadExist) {
            return res.status(400).json({ success: false, message: "Image already uploaded!" });
        }

        let userImageUrls;

        if (req.files && req.files.length > 0) {
            const userImagesLocal = req.files.map((file) => file.path);

            const userImages = await uploadCloudinary(userImagesLocal);

            userImageUrls = Array.isArray(userImages) ? userImages.map((image) => image.url)
                : [userImages.url];
        }

        const imageUploadData = await imageUpload.create({ image: userImageUrls, userId });

        await recommendation.update({ image: userImageUrls }, { where: { userId } });

        await User.update({ isImageFormFilled: true }, { where: { userId } });

        res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            imageUploadData
        })

    } catch (error) {
        return next(new errorhandler(error.message, 500));

    }



})



export const updateAboutAndImages = catchAsyncError(async (req, res, next) => {
    const userId = req.user.userId;

    try {
        const { aboutYourSelf } = req.body;
        let updatedAbout = false;
        let updatedImages = false;

        if (aboutYourSelf) {
            const personal = await personalDetails.findOne({ where: { userId } });

            if (!personal) {
                return res.status(404).json({ success: false, message: "Personal details not found!" });
            }

            await personalDetails.update({ aboutYourSelf }, { where: { userId } });
            await recommendation.update({ aboutYourSelf }, { where: { userId } });

            updatedAbout = true;
        }

        if (req.files && req.files.length > 0) {
            const imageUploadExist = await imageUpload.findOne({ where: { userId } });

            const imagePaths = req.files.map(file => file.path);
            const uploadedImages = await uploadCloudinary(imagePaths);
            const newImageUrls = Array.isArray(uploadedImages) ? uploadedImages.map(img => img.url) : [uploadedImages.url];

            if (imageUploadExist) {
                await imageUpload.update({ image: newImageUrls }, { where: { userId } });
            } else {
                await imageUpload.create({ image: newImageUrls, userId });
            }

            await recommendation.update({ image: newImageUrls }, { where: { userId } });

            updatedImages = true;
        }

       
        if (updatedAbout || updatedImages) {
            const personal = await personalDetails.findOne({ where: { userId } });
            const user = await User.findOne({ where: { userId } }); 

            await sendEmail({
                email: "IT-support@wedlock.com.au",
        
                subject: `User ${personal.displayName} updated their profile`,
                template: 'profileUpdateNotification.ejs',
                data: {
                    name: `${personal.firstName} ${personal.lastName}`,
                    userId: userId,
                    email: user?.email || 'N/A',
                    about: aboutYourSelf || personal.aboutYourSelf || 'N/A',
                    updatedAbout,
                    updatedImages
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Details updated successfully",
        });

    } catch (err) {
        return next(new errorhandler(err.message, 500));
    }
});
