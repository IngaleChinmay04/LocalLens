import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param {File|string} file - The file to upload or a data URI
 * @param {string} folder - The folder to upload to (optional)
 * @param {string} publicId - Custom public ID (optional)
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadToCloudinary = (file, folder = "", publicId = "") => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "auto",
    };

    if (publicId) {
      options.public_id = publicId;
    }

    // Check if the file is a File object or a data URI
    if (typeof file === "string") {
      // It's already a data URI, just upload it
      cloudinary.uploader.upload(file, options, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    } else if (
      file instanceof File ||
      (typeof Blob !== "undefined" && file instanceof Blob)
    ) {
      // For File or Blob objects, we need to convert them to a data URI or use upload_stream
      const reader = new FileReader();
      reader.onloadend = () => {
        // FileReader result is a data URL, upload that
        cloudinary.uploader.upload(reader.result, options, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    } else {
      reject(
        new Error("Invalid file type. Expected File, Blob or data URI string.")
      );
    }
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
