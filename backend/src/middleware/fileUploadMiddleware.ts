import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({ storage: multer.memoryStorage() });

export const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "roadport", transformation: [{ width: 1200, crop: "limit" }] },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      )
      .end(file.buffer);
  });
};