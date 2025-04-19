import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Reservation from "@/models/Reservation.model";
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

      // Get reservations for this shop
      const reservations = await Reservation.find({ shopId })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      return NextResponse.json(
        { error: "Failed to fetch reservations" },
        { status: 500 }
      );
    }
  });
}
