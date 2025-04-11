import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function POST(request) {
  return withFirebaseAuth(request, handlePostRequest, ["customer", "retailer"]);
}

async function handlePostRequest(request, user) {
  try {
    await dbConnect();

    // Get form data from the request
    const formData = await request.formData();

    // Use the authenticated user from Firebase middleware
    const userId = user._id;

    // Process logo upload if it exists
    let logoUrl = null;
    const logoFile = formData.get("logo");
    if (logoFile && logoFile.size > 0) {
      // For development purposes, store a placeholder URL
      // In production, this should be replaced with actual image upload logic
      logoUrl =
        formData.get("logoUrl") ||
        "https://placeholder.com/shop_logo_" + Date.now();
    }

    // Process verification document upload if it exists
    let verificationDocUrl = null;
    const verificationDocFile = formData.get("verificationDocument");
    if (verificationDocFile && verificationDocFile.size > 0) {
      // In production, this should be replaced with actual document upload logic
      verificationDocUrl =
        formData.get("verificationDocumentUrl") ||
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
    if (user.role !== "retailer") {
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
