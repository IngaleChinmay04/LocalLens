import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";

export async function GET(request) {
  try {
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // Validate status
    const validStatuses = ["pending", "verified", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    console.log(`Fetching shops with status: ${status}`);

    // Fetch shops with the given status
    const shops = await Shop.find({ verificationStatus: status })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${shops.length} shops with status ${status}`);

    // For each shop, get the owner details
    const shopsWithOwnerDetails = await Promise.all(
      shops.map(async (shop) => {
        try {
          const owner = await User.findById(shop.ownerId)
            .select("email displayName")
            .lean();

          return {
            ...shop,
            owner: owner || { email: "Unknown", displayName: "Unknown" },
          };
        } catch (error) {
          console.error(`Error fetching owner for shop ${shop._id}:`, error);
          return {
            ...shop,
            owner: { email: "Error", displayName: "Error fetching owner" },
          };
        }
      })
    );

    return NextResponse.json(shopsWithOwnerDetails);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops: " + error.message },
      { status: 500 }
    );
  }
}
