import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";

export async function POST(request) {
  try {
    await dbConnect();

    // Get form data from the request
    const formData = await request.formData();

    // Try to get user ID from header or formData
    let userId = null;
    const userEmail = request.headers.get("x-user-email");

    if (userEmail) {
      // Find user by email
      const user = await User.findOne({ email: userEmail });
      if (user) {
        userId = user._id;
      }
    }

    // As a fallback, check if there's a userId in formData
    if (!userId && formData.get("userId")) {
      userId = formData.get("userId");
    }

    // If we still don't have a userId, use a dummy user for testing
    // IMPORTANT: Remove this in production
    if (!userId) {
      console.log(
        "⚠️ Warning: Using dummy user ID for testing. Remove in production."
      );
      // Find any user with role "retailer" to use as a placeholder
      const dummyUser = await User.findOne({ role: "retailer" });
      if (dummyUser) {
        userId = dummyUser._id;
      } else {
        // If no retailer user exists, find any user
        const anyUser = await User.findOne({});
        if (anyUser) {
          userId = anyUser._id;
          // Update this user to be a retailer
          await User.findByIdAndUpdate(anyUser._id, { role: "retailer" });
        } else {
          return NextResponse.json(
            {
              error:
                "No users found in the system. Please create a user first.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Process logo upload if it exists
    let logoUrl = null;
    const logoFile = formData.get("logo");
    if (logoFile && logoFile.size > 0) {
      // For development purposes, store a placeholder URL
      logoUrl = "https://placeholder.com/shop_logo_" + Date.now();
    }

    // Process verification document upload if it exists
    let verificationDocUrl = null;
    const verificationDocFile = formData.get("verificationDocument");
    if (verificationDocFile && verificationDocFile.size > 0) {
      // For development purposes, store a placeholder URL
      verificationDocUrl =
        "https://placeholder.com/verification_doc_" + Date.now();
    }

    // Get categories array
    const categoriesArray = formData.getAll("categories[]");

    // Create the shop object
    const shopData = {
      ownerId: userId,
      name: formData.get("name"),
      description: formData.get("description"),
      logo: logoUrl,
      contactEmail: formData.get("contactEmail"),
      contactPhone: formData.get("contactPhone"),
      website: formData.get("website"),
      address: {
        addressLine1: formData.get("addressLine1"),
        addressLine2: formData.get("addressLine2"),
        city: formData.get("city"),
        state: formData.get("state"),
        postalCode: formData.get("postalCode"),
        country: formData.get("country"),
      },
      location: {
        type: "Point",
        coordinates: [
          parseFloat(formData.get("longitude")),
          parseFloat(formData.get("latitude")),
        ],
      },
      categories: categoriesArray.length > 0 ? categoriesArray : [],
      registrationNumber: formData.get("registrationNumber"),
      gstin: formData.get("gstin"),
      verificationStatus: "pending",
      verificationDocument: verificationDocUrl,
    };

    console.log("Creating shop with data:", {
      name: shopData.name,
      ownerId: shopData.ownerId,
      contactEmail: shopData.contactEmail,
    });

    // Create the shop in the database
    const newShop = await Shop.create(shopData);
    console.log("Shop created successfully:", newShop._id);

    // Update user role to retailer if not already
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        { $set: { role: "retailer" } },
        { new: true }
      );
    }

    return NextResponse.json(newShop, { status: 201 });
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      { error: "Failed to create shop: " + error.message },
      { status: 500 }
    );
  }
}
