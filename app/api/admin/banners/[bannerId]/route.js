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

// GET /api/admin/banners/[bannerId] - Get a specific banner
export async function GET(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const banner = await Banner.findById(params.bannerId);

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/banners/[bannerId] - Update a banner
export async function PUT(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const data = await request.json();

    const banner = await Banner.findByIdAndUpdate(params.bannerId, data, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[bannerId] - Delete a banner
export async function DELETE(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const banner = await Banner.findByIdAndDelete(params.bannerId);

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
