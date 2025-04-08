import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import { NextResponse } from "next/server";

// Get all users with pagination
export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const role = url.searchParams.get("role");

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};
    if (role) {
      query.role = role;
    }

    // Count total documents (for pagination metadata)
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(req) {
  try {
    await dbConnect();

    const userData = await req.json();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({
      $or: [{ firebaseUid: userData.firebaseUid }, { email: userData.email }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user: " + error.message },
      { status: 500 }
    );
  }
}
