import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    // Access shopId from params.shopId correctly
    const shopId = params.shopId;

    // Validate shopId format
    if (!shopId || !shopId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid shop ID format" },
        { status: 400 }
      );
    }

    // Find the shop by ID
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}
