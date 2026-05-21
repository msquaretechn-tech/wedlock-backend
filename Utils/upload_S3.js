import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
 
export const uploadToS3 = async (localFilePaths) => {
  try {
    if (!localFilePaths) {
      throw new Error("Local file paths are missing.");
    }

    const files = Array.isArray(localFilePaths) ? localFilePaths : [localFilePaths];
    const uploadedImages = [];

    for (const localFilePath of files) {
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`File not found: ${localFilePath}`);
      }

      const fileStream = fs.createReadStream(localFilePath);
      const fileName = `${Date.now()}-${path.basename(localFilePath)}`; 

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Body: fileStream,
        ContentType: 'image/jpeg',
      };

      const command = new PutObjectCommand(params);
       await s3.send(command);
     
    

      uploadedImages.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`);

      fs.unlinkSync(localFilePath);
    }

    console.log("Images uploaded successfully:", uploadedImages);

    return uploadedImages.length === 1 ? uploadedImages[0] : uploadedImages;

  } catch (error) {
    console.error("S3 Upload Error:", error.message);
    throw error;
  }
};

export const deleteFromS3 = async (fileKey) => {
  try {
    if (!fileKey) {
      throw new Error("File key is required for deletion.");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    console.log(`File deleted successfully: ${fileKey}`);
    return { success: true, message: "File deleted successfully." };

  } catch (error) {
    console.error("S3 Deletion Error:", error.message);
    throw error;
  }
};
 