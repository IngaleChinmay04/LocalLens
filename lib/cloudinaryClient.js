/**
 * Uploads a file to Cloudinary using server API
 * @param {File} file - The file to upload
 * @param {string} folder - The folder in Cloudinary to store the file
 * @param {string} publicId - Optional public ID for the file
 * @param {Function} getIdToken - Function to get Firebase ID token
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export async function uploadToCloudinaryViaAPI(
  file,
  folder,
  publicId,
  getIdToken
) {
  console.log(
    `[DEBUG] uploadToCloudinaryViaAPI called: folder=${folder}, file size=${file.size}, type=${file.type}`
  );

  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (publicId) {
    formData.append("publicId", publicId);
  }

  console.log(
    `[DEBUG] FormData prepared for Cloudinary upload: has file=${!!formData.get(
      "file"
    )}`
  );

  // Get Firebase token for authentication
  const token = await getIdToken();

  if (!token) {
    console.error("[ERROR] Authentication token not available");
    throw new Error("Authentication token not available");
  }

  console.log(`[DEBUG] Making request to /api/upload with auth token`);

  try {
    // Make a POST request to our server API
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log(`[DEBUG] /api/upload response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error(
        `[ERROR] Upload API failed: ${error.error || "Unknown error"}`
      );
      throw new Error(error.error || "Failed to upload image");
    }

    const result = await response.json();
    console.log(
      `[DEBUG] Cloudinary upload successful: url=${result.secure_url}`
    );
    return result;
  } catch (error) {
    console.error(`[ERROR] Error in uploadToCloudinaryViaAPI:`, error);
    throw error;
  }
}

/**
 * Uploads a file directly to Cloudinary from the client side
 * Only use this for public, non-sensitive files
 * Requires an unsigned upload preset configured in Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder in Cloudinary to store the file
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export async function uploadToCloudinaryClient(file, folder) {
  console.log(
    `[DEBUG] uploadToCloudinaryClient called: folder=${folder}, file size=${file.size}, type=${file.type}`
  );

  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
  formData.append("folder", folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
  console.log(`[DEBUG] Uploading directly to Cloudinary: ${cloudinaryUrl}`);

  try {
    // Make a POST request to Cloudinary's upload API
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    console.log(
      `[DEBUG] Cloudinary direct upload response status: ${response.status}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[ERROR] Failed to upload directly to Cloudinary: ${errorText}`
      );
      throw new Error(`Failed to upload image to Cloudinary: ${errorText}`);
    }

    const result = await response.json();
    console.log(
      `[DEBUG] Direct Cloudinary upload successful: url=${result.secure_url}`
    );
    return result;
  } catch (error) {
    console.error(`[ERROR] Error in uploadToCloudinaryClient:`, error);
    throw error;
  }
}
