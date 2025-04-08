import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import { NextResponse } from "next/server";

// Get user by email
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const email = decodeURIComponent(params.email);
    const user = await User.findOne({ email }).select("-__v");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// Update last login
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const email = decodeURIComponent(params.email);
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { lastLogin: new Date() } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Last login updated" });
  } catch (error) {
    console.error("Error updating last login:", error);
    return NextResponse.json(
      { error: "Failed to update last login" },
      { status: 500 }
    );
  }
}
