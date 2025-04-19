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

    console.log("Auth header present:", !!authHeader);

    // Check if Authorization header exists and has the right format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error(
        "Missing or invalid token format. Auth header:",
        authHeader ? authHeader.substring(0, 15) + "..." : "null"
      );
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token format" },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1];
    console.log("Token extracted, length:", token ? token.length : 0);

    try {
      // Verify the token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log("Token verified successfully for:", decodedToken.email);

      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email;

      // Find user in MongoDB
      const user = await User.findOne({ email });

      if (!user) {
        console.error("User not found in database for email:", email);
        return NextResponse.json(
          { error: "Unauthorized: User not found in database" },
          { status: 401 }
        );
      }

      console.log(
        "User found in database:",
        user._id.toString(),
        "Role:",
        user.role
      );

      // Check for required roles if specified
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        console.error(
          "Insufficient permissions. User role:",
          user.role,
          "Required roles:",
          requiredRoles
        );
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      // All checks passed, call the handler with the user
      return handler(req, user);
    } catch (verifyError) {
      console.error("Firebase token verification error:", verifyError);

      if (verifyError.code === "auth/id-token-expired") {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      } else if (verifyError.code === "auth/id-token-revoked") {
        return NextResponse.json({ error: "Token revoked" }, { status: 401 });
      } else if (verifyError.code === "auth/argument-error") {
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            error: `Authentication failed: ${
              verifyError.message || verifyError.code || "Unknown error"
            }`,
          },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error("General auth middleware error:", error);
    return NextResponse.json(
      {
        error:
          "Server authentication error: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
