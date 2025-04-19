import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function GET(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      await dbConnect();

      const { shopId } = params;

      // Validate shopId
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json({ error: "Invalid shop ID" }, { status: 400 });
      }

      // Get the user ID from Firebase auth middleware
      const userId = user._id;

      // Check if the shop belongs to the user
      const shop = await Shop.findOne({
        _id: shopId,
        ownerId: userId,
      });

      if (!shop) {
        return NextResponse.json(
          { error: "Shop not found or you don't have permission" },
          { status: 404 }
        );
      }

      // Get orders where any item has this shop ID
      const orders = await Order.find({
        "items.shopId": shopId,
      })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }
  });
}
