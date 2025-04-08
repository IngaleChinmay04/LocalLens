import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder in Cloudinary to store the file
 * @param {string} publicId - The public ID for the file
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export async function uploadToCloudinary(file, folder, publicId) {
  // First convert the file to a base64 string
  const fileBuffer = await file.arrayBuffer();
  const base64File = Buffer.from(fileBuffer).toString("base64");
  const dataURI = `data:${file.type};base64,${base64File}`;

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataURI,
      {
        folder,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - The Cloudinary deletion result
 */
export async function deleteFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
