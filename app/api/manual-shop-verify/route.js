import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await dbConnect();

    // Get data from request
    const data = await request.json();
    const { shopId, status } = data;

    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["verified", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Validate shopId format
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return NextResponse.json(
        { error: "Invalid shop ID format" },
        { status: 400 }
      );
    }

    // Find the shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    console.log(`Manually updating shop ${shopId} status to ${status}`);

    // Update shop verification status
    shop.verificationStatus = status;
    shop.verificationDate = new Date();
    shop.isVerified = status === "verified";

    await shop.save();

    // If shop is approved, ensure the owner has the retailer role
    if (status === "verified") {
      const ownerId = shop.ownerId;
      if (ownerId) {
        const owner = await User.findById(ownerId);
        if (owner) {
          owner.role = "retailer";
          await owner.save();
          console.log(`User ${ownerId} role updated to retailer`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Shop ${
        status === "verified" ? "approved" : "rejected"
      } successfully`,
      shop: {
        _id: shop._id,
        name: shop.name,
        verificationStatus: shop.verificationStatus,
        isVerified: shop.isVerified,
        verificationDate: shop.verificationDate,
      },
    });
  } catch (error) {
    console.error("Error in manual shop verification:", error);
    return NextResponse.json(
      { error: "Failed to verify shop: " + error.message },
      { status: 500 }
    );
  }
}
