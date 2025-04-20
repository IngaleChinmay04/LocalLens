import { adminAuth } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

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

export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, password } = await request.json();

    // Validate email and password
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user in Firebase Authentication with provided password
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Generate password reset link as a fallback (simple approach)
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: userRecord.uid,
      resetLink: resetLink,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
