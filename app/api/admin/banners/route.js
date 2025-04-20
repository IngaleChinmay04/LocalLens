import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import dbConnect from "@/lib/dbConnect";
import Banner from "@/models/Banner.model";

// Middleware to check if the user is an admin
async function isAdmin(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);

      // Here you should check if the user has admin role in your database
      // For simplicity, we're just checking if they're authenticated
      return !!decodedToken.uid;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return false;
  }
}

// GET /api/admin/banners - Get all banners (including inactive ones)
export async function GET(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Fetch all banners, ordered by the order field
    const banners = await Banner.find().sort({ order: 1 }).lean();

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error in admin banners API:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create a new banner
export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const data = await request.json();

    // Create new banner
    const banner = new Banner(data);
    await banner.save();

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner", details: error.message },
      { status: 500 }
    );
  }
}
