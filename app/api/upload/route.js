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
    // With App Router, we need to use the ReadableStream API
    const formData = await request.formData();

    // Get the file from the form data
    const file = formData.get("file");
    const folder = formData.get("folder") || "locallens";
    const publicId = formData.get("publicId") || `${folder}/${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString("base64");
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
