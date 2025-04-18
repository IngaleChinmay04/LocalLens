import dbConnect from "@/lib/dbConnect";
import Address from "@/models/Address.model";
import User from "@/models/User.model";
import { NextResponse } from "next/server";

// Get all addresses for a user
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// Create a new address
export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();

    // Create address
    const address = await Address.create(data);

    // Update user's addressIds array
    await User.findByIdAndUpdate(
      data.userId,
      { $push: { addressIds: address._id } },
      { new: true }
    );

    // If this is marked as default, update all other addresses to not be default
    if (address.isDefault) {
      await Address.updateMany(
        { userId: data.userId, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );

      // Also update user's primaryAddressId
      await User.findByIdAndUpdate(
        data.userId,
        { $set: { primaryAddressId: address._id } },
        { new: true }
      );
    }

    // If this is the first address, make it default regardless
    const addressCount = await Address.countDocuments({ userId: data.userId });
    if (addressCount === 1) {
      await Address.findByIdAndUpdate(
        address._id,
        { $set: { isDefault: true } },
        { new: true }
      );

      // Also update user's primaryAddressId
      await User.findByIdAndUpdate(
        data.userId,
        { $set: { primaryAddressId: address._id } },
        { new: true }
      );
    }

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
