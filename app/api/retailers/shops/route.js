import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";
import mongoose from "mongoose";

export async function GET(request) {
  return withFirebaseAuth(request, handleGetRequest, ["retailer", "admin"]);
}

async function handleGetRequest(request, user) {
  try {
    await dbConnect();

    // Get the user ID from the Firebase auth middleware
    const userId = user._id;

    // Check query parameter for verification status filter
    const { searchParams } = new URL(request.url);
    const verifiedOnly = searchParams.get("verified") === "true";

    // Build the query based on owner ID
    const query = { ownerId: userId };

    // Add verification filter if requested
    if (verifiedOnly) {
      query.verificationStatus = "verified";
    }

    // Find shops where this user is the owner
    const shops = await Shop.find(query).lean();

    // If no shops found, return empty array
    if (!shops || shops.length === 0) {
      return NextResponse.json([]);
    }

    // For each shop, fetch product and order counts
    const shopsWithCounts = await Promise.all(
      shops.map(async (shop) => {
        // Get product count - handle case where Product model might not exist
        let productCount = 0;
        try {
          if (mongoose.models.Product) {
            productCount = await mongoose.models.Product.countDocuments({
              shopId: shop._id,
            });
          }
        } catch (err) {
          console.error("Error counting products:", err);
        }

        // Get order count - handle case where Order model might not exist
        let orderCount = 0;
        try {
          if (mongoose.models.Order) {
            orderCount = await mongoose.models.Order.countDocuments({
              "items.shopId": shop._id,
            });
          }
        } catch (err) {
          console.error("Error counting orders:", err);
        }

        return {
          ...shop,
          productCount,
          orderCount,
        };
      })
    );

    return NextResponse.json(shopsWithCounts);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
