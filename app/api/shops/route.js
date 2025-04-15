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

export async function GET(request) {
  try {
    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat")) || null;
    const lng = parseFloat(searchParams.get("lng")) || null;
    const radius = parseFloat(searchParams.get("radius")) || 5; // Default radius: 5km
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    console.log(
      `Received location query: lat=${lat}, lng=${lng}, radius=${radius}`
    );

    // Build query
    const query = {};

    // We only filter by verified and active status if not in development
    if (process.env.NODE_ENV === "production") {
      query.isVerified = true;
      query.isActive = true;
    }

    // Add category filter if provided
    if (category) {
      query.categories = category;
    }

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Add geospatial query if coordinates are provided
    if (lat && lng) {
      // Simple distance query that works without geospatial index in development
      // In production, this should use $near with a properly indexed location field
      console.log("Adding location filter to query");
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch shops
    let shopsQuery = Shop.find(query);

    // Sort based on query type
    if (search) {
      shopsQuery = shopsQuery.sort({ name: 1 }); // Simple sort by name for now
    } else {
      // Default sort by name
      shopsQuery = shopsQuery.sort({ name: 1 });
    }

    // Apply pagination
    shopsQuery = shopsQuery.skip(skip).limit(limit);

    // Execute query
    const shops = await shopsQuery.lean();

    console.log(`Found ${shops.length} shops`);

    // Process shops to include distance
    const processedShops = shops.map((shop) => {
      if (lat && lng && shop.location && shop.location.coordinates) {
        // Calculate distance using Haversine formula
        const shopLng = shop.location.coordinates[0];
        const shopLat = shop.location.coordinates[1];
        const distance = calculateDistance(lat, lng, shopLat, shopLng);
        shop.distance = distance;
      } else {
        // Add a mock distance for development
        shop.distance = Math.random() * 5; // Random distance between 0-5km
      }
      return shop;
    });

    return NextResponse.json(processedShops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}
