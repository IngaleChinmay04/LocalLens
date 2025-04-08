import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";

export async function POST(request, { params }) {
  try {
    await dbConnect();

    const { shopId } = params;
    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    // Get status from request body
    const { status } = await request.json();

    // Validate status
    const validStatuses = ["verified", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    console.log(`Updating shop ${shopId} status to ${status}`);

    // Update shop verification status
    shop.verificationStatus = status;
    shop.verificationDate = new Date();
    shop.isVerified = status === "verified";

    await shop.save();
    console.log(`Shop ${shopId} updated successfully`);

    // If shop is approved, ensure the owner has the retailer role
    if (status === "verified") {
      const owner = await User.findById(shop.ownerId);
      if (owner) {
        owner.role = "retailer";
        await owner.save();
        console.log(`User ${owner._id} role updated to retailer`);
      }
    }

    return NextResponse.json({
      message: `Shop ${
        status === "verified" ? "approved" : "rejected"
      } successfully`,
      shop,
    });
  } catch (error) {
    console.error("Error verifying shop:", error);
    return NextResponse.json(
      { error: "Failed to verify shop: " + error.message },
      { status: 500 }
    );
  }
}
