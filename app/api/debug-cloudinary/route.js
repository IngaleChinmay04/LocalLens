// This file checks Cloudinary configuration
import { NextResponse } from "next/server";

export async function GET() {
  // Log to server console
  console.log("Cloudinary Configuration Check:");
  console.log(
    `CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || "NOT SET"}`
  );
  console.log(
    `CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET"}`
  );
  console.log(
    `CLOUDINARY_API_SECRET: ${
      process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET"
    }`
  );
  console.log(
    `CLOUDINARY_UPLOAD_PRESET: ${
      process.env.CLOUDINARY_UPLOAD_PRESET || "NOT SET"
    }`
  );
  console.log(
    `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "NOT SET"
    }`
  );
  console.log(
    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOT SET"
    }`
  );

  // Return the information (omitting secrets)
  return NextResponse.json({
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "NOT SET",
    cloudinary_api_key_set: process.env.CLOUDINARY_API_KEY ? "YES" : "NO",
    cloudinary_api_secret_set: process.env.CLOUDINARY_API_SECRET ? "YES" : "NO",
    cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "NOT SET",
    next_public_cloudinary_cloud_name:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "NOT SET",
    next_public_cloudinary_upload_preset:
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOT SET",
  });
}
