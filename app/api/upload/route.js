import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In App Router, we need to handle multipart/form-data differently
export async function POST(request) {
  return withFirebaseAuth(request, handlePostRequest, ["retailer", "admin"]);
}

async function handlePostRequest(request, user) {
  try {
    console.log("[DEBUG] Starting Cloudinary upload process");

    // With App Router, we need to use the ReadableStream API
    const formData = await request.formData();

    // Get the file from the form data
    const file = formData.get("file");
    const folder = formData.get("folder") || "locallens";
    const publicId = formData.get("publicId") || `${folder}/${Date.now()}`;

    console.log(
      `[DEBUG] Upload request: folder=${folder}, file present=${!!file}, type=${
        file?.type
      }`
    );

    if (!file) {
      console.log("[ERROR] No file provided in upload request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("[ERROR] Cloudinary configuration missing");
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    // Convert the file to a buffer
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString("base64");
    const dataURI = `data:${file.type};base64,${base64String}`;

    console.log(
      `[DEBUG] Prepared file for upload: size=${buffer.byteLength} bytes`
    );

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      console.log(
        `[DEBUG] Initiating Cloudinary upload: folder=${folder}, publicId=${publicId}`
      );

      cloudinary.uploader.upload(
        dataURI,
        {
          folder,
          public_id: publicId,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error("[ERROR] Cloudinary upload failed:", error);
            reject(error);
          } else {
            console.log(
              `[DEBUG] Cloudinary upload successful: url=${result.secure_url}`
            );
            resolve(result);
          }
        }
      );
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ERROR] Error uploading to Cloudinary:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
