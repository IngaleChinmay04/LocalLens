import dbConnect from "@/lib/dbConnect";
import Address from "@/models/Address.model";
import User from "@/models/User.model";
import { NextResponse } from "next/server";

// Get a specific address
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const address = await Address.findById(params.id);

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

// Update address
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const data = await req.json();
    const addressId = params.id;

    // Find address first
    const address = await Address.findById(addressId);

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, update all other addresses
    if (data.isDefault) {
      await Address.updateMany(
        { userId: address.userId, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );

      // Also update user's primaryAddressId
      await User.findByIdAndUpdate(
        address.userId,
        { $set: { primaryAddressId: addressId } },
        { new: true }
      );
    }

    // Update the address
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: data },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// Delete address
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const addressId = params.id;

    // Find address first to get the userId
    const address = await Address.findById(addressId);

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If this is the default address, we need special handling
    if (address.isDefault) {
      // Find another address to make default
      const anotherAddress = await Address.findOne({
        userId: address.userId,
        _id: { $ne: addressId },
      });

      if (anotherAddress) {
        // Make another address the default
        await Address.findByIdAndUpdate(
          anotherAddress._id,
          { $set: { isDefault: true } },
          { new: true }
        );

        // Update user's primaryAddressId
        await User.findByIdAndUpdate(
          address.userId,
          { $set: { primaryAddressId: anotherAddress._id } },
          { new: true }
        );
      } else {
        // If no other address, set primaryAddressId to null
        await User.findByIdAndUpdate(
          address.userId,
          { $set: { primaryAddressId: null } },
          { new: true }
        );
      }
    }

    // Remove address from user's addressIds array
    await User.findByIdAndUpdate(
      address.userId,
      { $pull: { addressIds: addressId } },
      { new: true }
    );

    // Delete the address
    await Address.findByIdAndDelete(addressId);

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
