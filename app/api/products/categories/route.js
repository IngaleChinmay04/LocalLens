import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";

export async function GET() {
  try {
    await dbConnect();

    // Aggregate to get unique categories
    const categoriesData = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category" } },
      { $sort: { _id: 1 } },
    ]);

    const categories = categoriesData.map((item) => item._id);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
