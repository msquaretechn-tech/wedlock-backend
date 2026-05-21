import { Op, where } from "sequelize";
import happyStories from "../Models/happyStories.model.js";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import { uploadCloudinary } from "../Utils/cloudinary.js";

export const addStory = catchAsyncError(async (req, res, next) => {
    try {
        const UserId = req.user.userId;
    
        const  {customerName, partnerName, description} = req.body;
        console.log(customerName, partnerName, description)


        if (!customerName || !partnerName || !description) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        console.log(req.files)
 

        if (!req.files) {
            return res.status(400).json({ success: false, message: "Please upload an image!" });
        }

        let userImageUrl;
    
        if (req.files && req.files.length > 0) {
            const userImageLocal = req.files[0].path;
            console.log(userImageLocal)
    
            const userImage = await uploadCloudinary(userImageLocal); 
            console.log(userImage.url)
    
            userImageUrl = userImage.url;
        }

         await happyStories.create({userId: UserId, customerName, partnerName, description, image: userImageUrl});

        res.status(201).json({
            success: true,
            message: "Happy Story added successfully",
        })


    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})

export const  getAllStories = catchAsyncError(async (req, res, next) => {
    try {
        const stories = await happyStories.findAll(
            {
                order: [["createdAt", "DESC"]],
            }
        );

        const data = stories.map((story) => {
            return {
                id: story.id,
                customerName: story.customerName,
                partnerName: story.partnerName,
                description: story.description,
                image: story.image,
                createdDate: story.createdAt.toISOString().split('T')[0],
            }
        })

        res.status(200).json({
            success: true,
            stories: data,
        })

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const deleteStory = catchAsyncError(async (req, res, next) => {
    try {
        const {storyId} = req.body;

        if (!storyId) {
            return next(new errorhandler("Please enter all fields", 400));
        }

        await happyStories.destroy({
            where: {
                storyId
            }
        });

        res.status(200).json({
            success: true,
            message: "Happy Story deleted successfully",
        })

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})