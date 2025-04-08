import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    await dbConnect();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = session.user.id;

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
