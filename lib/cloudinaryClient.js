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
  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (publicId) {
    formData.append("publicId", publicId);
  }

  // Get Firebase token for authentication
  const token = await getIdToken();

  if (!token) {
    throw new Error("Authentication token not available");
  }

  // Make a POST request to our server API
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
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
  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
  formData.append("folder", folder);

  // Make a POST request to Cloudinary's upload API
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  return response.json();
}
