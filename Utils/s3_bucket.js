import aws from "aws-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();



const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});


export const uploadFileS3 = async (file) => {
    if (!file) {
      throw new Error("No file provided.");
    }
  
    const fileName = `${Date.now()}-${file.originalname}`;
  
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${fileName}`,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };
  
    try {
      const data = await s3.upload(params).promise();
      console.log("File uploaded successfully:", data.Location);
      return data.Location;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };