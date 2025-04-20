import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";

// Simple admin auth check
async function isAdmin(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      // Just check if they have a valid token
      return !!decodedToken.uid;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return false;
  }
}

export async function GET(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Connect to the database
    await dbConnect();

    // Get the role filter from query parameters
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");

    // Build the query
    const query = roleFilter ? { role: roleFilter } : {};

    // Fetch users based on the query
    const users = await User.find(query)
      .select("name email role createdAt isEmailVerified")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
