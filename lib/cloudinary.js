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
  console.log(
    `[DEBUG] uploadToCloudinary called: folder=${folder}, has publicId=${!!publicId}`
  );
  console.log(
    `[DEBUG] File type: ${typeof file}, is File: ${
      file instanceof File
    }, is Blob: ${typeof Blob !== "undefined" && file instanceof Blob}`
  );

  // Verify that Cloudinary is properly configured
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error("[ERROR] Cloudinary configuration missing");
    return Promise.reject(
      new Error(
        "Cloudinary configuration is missing. Check your environment variables."
      )
    );
  }

  if (!file) {
    console.error("[ERROR] No file provided to uploadToCloudinary");
    return Promise.reject(new Error("No file provided for upload"));
  }

  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "auto",
    };

    if (publicId) {
      options.public_id = publicId;
    }

    console.log(`[DEBUG] Upload options:`, JSON.stringify(options));

    // Check if the file is a File object or a data URI
    if (typeof file === "string") {
      // It's already a data URI, just upload it
      console.log(
        `[DEBUG] Uploading string data to Cloudinary: length=${file.length}`
      );
      cloudinary.uploader.upload(file, options, (error, result) => {
        if (error) {
          console.error("[ERROR] Cloudinary upload failed:", error);
          reject(error);
        } else {
          console.log(
            `[DEBUG] Cloudinary upload successful: url=${result.secure_url}`
          );
          resolve(result);
        }
      });
    } else if (
      file instanceof File ||
      (typeof Blob !== "undefined" && file instanceof Blob)
    ) {
      // For File or Blob objects, we need to convert them to a data URI or use upload_stream
      console.log(
        `[DEBUG] Converting File/Blob to data URI: name=${file.name}, size=${file.size}, type=${file.type}`
      );
      const reader = new FileReader();
      reader.onloadend = () => {
        // FileReader result is a data URL, upload that
        console.log(
          `[DEBUG] FileReader conversion complete, uploading data URI to Cloudinary`
        );
        cloudinary.uploader.upload(reader.result, options, (error, result) => {
          if (error) {
            console.error(
              "[ERROR] Cloudinary upload failed after FileReader conversion:",
              error
            );
            reject(error);
          } else {
            console.log(
              `[DEBUG] Cloudinary upload successful: url=${result.secure_url}`
            );
            resolve(result);
          }
        });
      };
      reader.onerror = (error) => {
        console.error("[ERROR] FileReader failed to read file:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    } else if (file.arrayBuffer && typeof file.arrayBuffer === "function") {
      // Handle special cases like FormData files from Next.js
      console.log(`[DEBUG] Handling FormData file with arrayBuffer method`);
      (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const base64String = Buffer.from(buffer).toString("base64");
          const dataURI = `data:${file.type};base64,${base64String}`;

          console.log(
            `[DEBUG] Converted FormData file to data URI: size=${buffer.byteLength} bytes`
          );

          cloudinary.uploader.upload(dataURI, options, (error, result) => {
            if (error) {
              console.error(
                "[ERROR] Cloudinary upload failed with FormData file:",
                error
              );
              reject(error);
            } else {
              console.log(
                `[DEBUG] Cloudinary upload successful: url=${result.secure_url}`
              );
              resolve(result);
            }
          });
        } catch (error) {
          console.error("[ERROR] Error processing FormData file:", error);
          reject(error);
        }
      })();
    } else {
      console.error("[ERROR] Invalid file type provided:", file);
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
  console.log(`[DEBUG] Deleting file from Cloudinary: publicId=${publicId}`);

  if (!publicId) {
    console.error("[ERROR] No publicId provided to deleteFromCloudinary");
    return Promise.reject(new Error("No publicId provided for deletion"));
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("[ERROR] Cloudinary deletion failed:", error);
        reject(error);
      } else {
        console.log(`[DEBUG] Cloudinary deletion successful:`, result);
        resolve(result);
      }
    });
  });
};
