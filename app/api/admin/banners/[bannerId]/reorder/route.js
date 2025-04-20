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

// PUT /api/admin/banners/[bannerId]/reorder - Change banner order
export async function PUT(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const { direction } = await request.json();
    const bannerId = params.bannerId;

    // Find the current banner
    const currentBanner = await Banner.findById(bannerId);
    if (!currentBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Get all banners ordered by the 'order' field
    const allBanners = await Banner.find().sort({ order: 1 });

    // Find the current index
    const currentIndex = allBanners.findIndex(
      (b) => b._id.toString() === bannerId
    );

    if (direction === "up" && currentIndex > 0) {
      // Swap with the banner above
      const prevBanner = allBanners[currentIndex - 1];
      const tempOrder = currentBanner.order;

      currentBanner.order = prevBanner.order;
      await currentBanner.save();

      prevBanner.order = tempOrder;
      await prevBanner.save();
    } else if (direction === "down" && currentIndex < allBanners.length - 1) {
      // Swap with the banner below
      const nextBanner = allBanners[currentIndex + 1];
      const tempOrder = currentBanner.order;

      currentBanner.order = nextBanner.order;
      await currentBanner.save();

      nextBanner.order = tempOrder;
      await nextBanner.save();
    }

    return NextResponse.json({ message: "Banner order updated" });
  } catch (error) {
    console.error("Error reordering banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner order" },
      { status: 500 }
    );
  }
}
