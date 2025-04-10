import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function GET(request) {
  return withFirebaseAuth(request, handleGetRequest, ["retailer", "admin"]);
}

async function handleGetRequest(request, user) {
  try {
    await dbConnect();

    // Get the user ID directly from the user object provided by middleware
    const userId = user._id;

    // Fetch pending and rejected shops for this user
    const pendingShops = await Shop.find({
      ownerId: userId,
      verificationStatus: "pending",
    })
      .sort({ createdAt: -1 })
      .select("_id name createdAt")
      .lean();

    const rejectedShops = await Shop.find({
      ownerId: userId,
      verificationStatus: "rejected",
    })
      .sort({ createdAt: -1 })
      .select("_id name createdAt")
      .lean();

    return NextResponse.json({
      pending: pendingShops,
      rejected: rejectedShops,
    });
  } catch (error) {
    console.error("Error fetching shop status:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop status" },
      { status: 500 }
    );
  }
}
