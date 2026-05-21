import { v2 as cloudinary } from "cloudinary";
import dotenv from 'dotenv';
import errorhandler from "../Utils/errorhandler.js";
import fs from "fs";
dotenv.config();



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePaths) => {
  try {
    if (!localFilePaths) {
      return errorhandler(new Error("Local file paths are missing."), 400);
    }


    const files = Array.isArray(localFilePaths)
      ? localFilePaths
      : [localFilePaths];


    const uploadedImages = [];

    for (const localFilePath of files) {
      const res = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });


      uploadedImages.push(res);
      fs.unlinkSync(localFilePath);
    }



    return uploadedImages.length === 1 ? uploadedImages[0] : uploadedImages;

  } catch (error) {

    for (const localFilePath of localFilePaths) {
      fs.unlinkSync(localFilePath);
    }

    return next(new errorhandler(error.message, 500));
    
  }
};

const deleteCloudinary = async (publicPath) => {
  try {
    if (!publicPath) return null;
    const result = await cloudinary.uploader.destroy(publicPath);

    return result;

  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
};

export { uploadCloudinary, deleteCloudinary };
