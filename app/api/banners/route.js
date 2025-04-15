import { NextResponse } from "next/server";

/**
 * @route GET /api/banners
 * @desc Get promotional banners for the home page
 * @access Public
 */
export async function GET(request) {
  try {
    // In a real implementation, you would fetch this data from a database
    // For now, we'll return static data
    const banners = [
      {
        id: 1,
        image: "/assets/banner1.jpg",
        title: "Fresh Local Produce",
        description:
          "Support local farmers and get fresh produce delivered to your doorstep",
        link: "/category/grocery",
        backgroundColor: "from-emerald-600 to-teal-500",
      },
      {
        id: 2,
        image: "/assets/banner2.jpg",
        title: "Handcrafted Items",
        description: "Discover unique handmade products from local artisans",
        link: "/category/handicrafts",
        backgroundColor: "from-blue-600 to-indigo-500",
      },
      {
        id: 3,
        image: "/assets/banner3.jpg",
        title: "Local Food Festival",
        description:
          "Join us for a weekend of delicious local cuisine and fun activities",
        link: "/events/food-festival",
        backgroundColor: "from-amber-500 to-orange-600",
      },
    ];

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error in banners API:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
