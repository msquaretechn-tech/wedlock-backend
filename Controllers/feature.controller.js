import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import { Op } from "sequelize";

import Feature from "../Models/feature.model.js";


export const createFeature = catchAsyncError(async (req, res, next) => {
    try {
        const {name} = req.body;
       
        const isFeatureExist = await Feature.findOne({ where: { name } });

        if (isFeatureExist) {
            return next(new errorhandler("Feature already exist!", 400));
        }

        const featureData = await Feature.create({ name });

        if (!featureData) {
            return next(new errorhandler("Failed to create feature!", 500));
        }

        res.status(201).json({
            success: true,
            message: "Feature created successfully!",
            featureData,
        });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})


export const getFeature = catchAsyncError(async (req, res, next) => {
    try {
        const featureData = await Feature.findAll();

        if (!featureData) {
            return next(new errorhandler("Feature not found!", 404));   
        }

        res.status(200).json({
            success: true,
            data: featureData,
            message: "Feature fetched successfully!",
        }); 

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})