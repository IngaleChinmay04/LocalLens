import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param {string} dataURI - The data URI of the file
 * @param {Object} options - Options for the upload
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadToCloudinary = (dataURI, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(dataURI, options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file
 * @returns {Promise<Object>} - The Cloudinary delete result
 */
export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};
