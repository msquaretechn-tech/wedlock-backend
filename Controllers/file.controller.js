import { uploadCloudinary, deleteCloudinary } from "../Utils/cloudinary.js";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import fs from "fs";


export const uploadSingleFile = catchAsyncError(async (req, res, next) => {
  const userId = req.user.userId;

  if (!req.file || !req.file.path) {
    return next(new errorhandler("No file provided", 400));
  }

  const localFilePath = req.file.path;

  const uploaded = await uploadCloudinary(localFilePath); // Don't pass extra options

  
  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    userId,
    url: uploaded.url,
    publicId: uploaded.public_id,
  });
});


export const deleteSingleFile = catchAsyncError(async (req, res, next) => {
  const userId = req.user.userId;
  const { publicId } = req.body;

  if (!publicId) {
    return next(new errorhandler("publicId is required for deletion", 400));
  }

  const result = await deleteCloudinary(publicId);

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
    userId,
    data: result,
  });
});