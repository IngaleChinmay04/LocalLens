import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";

export async function GET() {
  try {
    await dbConnect();

    // Get all shops
    const shops = await Shop.find().lean();

    // For each shop, get the owner's email
    const shopsWithOwners = await Promise.all(
      shops.map(async (shop) => {
        let ownerEmail = "Unknown";
        try {
          const owner = await User.findById(shop.ownerId).lean();
          if (owner) {
            ownerEmail = owner.email;
          }
        } catch (error) {
          console.error(`Error finding owner for shop ${shop._id}:`, error);
        }

        return {
          ...shop,
          ownerEmail,
        };
      })
    );

    return NextResponse.json({
      shopsCount: shops.length,
      shops: shopsWithOwners.map((shop) => ({
        _id: shop._id,
        name: shop.name,
        ownerEmail: shop.ownerEmail,
        verificationStatus: shop.verificationStatus,
        createdAt: shop.createdAt,
        categories: shop.categories,
        location: shop.location,
      })),
    });
  } catch (error) {
    console.error("Debug shops error:", error);
    return NextResponse.json(
      { error: "Debug shops error", message: error.message },
      { status: 500 }
    );
  }
}
