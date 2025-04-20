import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Banner from "@/models/Banner.model";

/**
 * @route GET /api/banners
 * @desc Get promotional banners for the home page
 * @access Public
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Fetch active banners ordered by the order field
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // If no banners exist yet, return default banners
    if (banners.length === 0) {
      const defaultBanners = [
        {
          id: 1,
          image: "/assets/product1.jpg",
          title: "Fresh Local Produce",
          description:
            "Support local farmers and get fresh produce delivered to your doorstep",
          link: "/category/grocery",
          backgroundColor: "from-emerald-600 to-teal-500",
        },
        {
          id: 2,
          image: "/assets/product2.jpg",
          title: "Handcrafted Items",
          description: "Discover unique handmade products from local artisans",
          link: "/category/handicrafts",
          backgroundColor: "from-blue-600 to-indigo-500",
        },
        {
          id: 3,
          image: "/assets/product3.jpg",
          title: "Local Food Festival",
          description:
            "Join us for a weekend of delicious local cuisine and fun activities",
          link: "/events/food-festival",
          backgroundColor: "from-amber-500 to-orange-600",
        },
      ];

      return NextResponse.json(defaultBanners);
    }

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error in banners API:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
