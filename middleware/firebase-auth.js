import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";

// This middleware verifies the Firebase token from the Authorization header
// and attaches the user to the request
export async function withFirebaseAuth(req, handler, requiredRoles = null) {
  try {
    await dbConnect();

    // Get the Authorization header
    const authHeader = req.headers.get("Authorization");

    // Check if Authorization header exists and has the right format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1];

    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    // Find user in MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: User not found in database" },
        { status: 401 }
      );
    }

    // Check for required roles if specified
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // All checks passed, call the handler with the user
    return handler(req, user);
  } catch (error) {
    console.error("Auth error:", error);

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    } else if (error.code === "auth/id-token-revoked") {
      return NextResponse.json({ error: "Token revoked" }, { status: 401 });
    } else {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  }
}
