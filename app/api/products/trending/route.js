import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";

export async function GET(request) {
  try {
    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    // Find trending products
    // We can use either explicit isTrending flag or sort by viewCount/totalSales
    const trendingProducts = await Product.find({
      isActive: true,
      isAvailable: true,
    })
      .sort({
        isTrending: -1, // First priority: explicitly marked trending products
        viewCount: -1, // Second priority: most viewed
        totalSales: -1, // Third priority: most sold
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("shopId", "name location"); // Populate shop information

    // Get total count for pagination (considering only active and available products)
    const totalCount = await Product.countDocuments({
      isActive: true,
      isAvailable: true,
    });

    return NextResponse.json({
      products: trendingProducts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending products" },
      { status: 500 }
    );
  }
}
