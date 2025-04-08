import { NextResponse } from "next/server";
import User from "@/models/User.model";
import dbConnect from "@/lib/dbConnect";

export async function withAuth(req, handler, requiredRoles = null) {
  try {
    await dbConnect();

    // Get user's email from custom header (would be set by the client)
    const userEmail = req.headers.get("x-user-email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized: Missing user information" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    // If roles are required, check if user has the required role
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // If all checks pass, call the handler with the user
    return handler(req, user._id);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
