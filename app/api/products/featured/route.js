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

    // Find featured products
    const featuredProducts = await Product.find({
      isFeatured: true,
      isActive: true,
      isAvailable: true,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("shopId", "name location"); // Populate shop information

    // Get total count for pagination
    const totalCount = await Product.countDocuments({
      isFeatured: true,
      isActive: true,
      isAvailable: true,
    });

    return NextResponse.json({
      products: featuredProducts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
