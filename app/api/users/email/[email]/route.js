import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import { NextResponse } from "next/server";

// Get user by email
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const email = params.email;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "-__v"
    );

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

// Update last login time
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const email = params.email;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { lastLogin: new Date() } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user login time:", error);
    return NextResponse.json(
      { error: "Failed to update login time" },
      { status: 500 }
    );
  }
}
