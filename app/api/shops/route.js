import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import User from "@/models/User.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

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

    console.log("[DEBUG] Processing shop registration data");

    // Process logo URL
    let logoUrl = null;

    // CRITICAL FIX: First check for the direct URL from the frontend
    if (formData.has("logoUrl")) {
      logoUrl = formData.get("logoUrl");
      console.log(`[DEBUG] Found direct logo URL from frontend: ${logoUrl}`);
    } else {
      console.log("[DEBUG] No direct logo URL found, checking for logo file");
      // Fallback to file upload if no URL was provided
      const logoFile = formData.get("logo");
      if (logoFile && logoFile.size > 0) {
        try {
          console.log(
            `[DEBUG] Found logo file of size ${logoFile.size}, uploading to Cloudinary`
          );
          const uniqueId = `shop_logo_${Date.now()}`;
          const result = await uploadToCloudinary(
            logoFile,
            "locallens/shop-logos",
            uniqueId
          );
          logoUrl = result.secure_url;
          console.log(`[DEBUG] Successfully uploaded logo: ${logoUrl}`);
        } catch (error) {
          console.error("[ERROR] Error uploading logo to Cloudinary:", error);
        }
      }
    }

    // Process verification document URL
    let verificationDocUrl = null;

    // CRITICAL FIX: First check for the direct URL from the frontend
    if (formData.has("verificationDocumentUrl")) {
      verificationDocUrl = formData.get("verificationDocumentUrl");
      console.log(
        `[DEBUG] Found direct verification document URL from frontend: ${verificationDocUrl}`
      );
    } else {
      console.log(
        "[DEBUG] No direct verification document URL found, checking for document file"
      );
      // Fallback to file upload if no URL was provided
      const verificationDocFile = formData.get("verificationDocument");
      if (verificationDocFile && verificationDocFile.size > 0) {
        try {
          console.log(
            `[DEBUG] Found verification document of size ${verificationDocFile.size}, uploading to Cloudinary`
          );
          const uniqueId = `verification_${Date.now()}`;
          const result = await uploadToCloudinary(
            verificationDocFile,
            "locallens/verification-docs",
            uniqueId
          );
          verificationDocUrl = result.secure_url;
          console.log(
            `[DEBUG] Successfully uploaded verification document: ${verificationDocUrl}`
          );
        } catch (error) {
          console.error(
            "[ERROR] Error uploading verification document to Cloudinary:",
            error
          );
        }
      }
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
      logoUrl: shopData.logo, // CRITICAL FIX: Log the logo URL
      verificationDocumentUrl: shopData.verificationDocument, // CRITICAL FIX: Log the verification document URL
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
    const query = {
      isVerified: true, // Only show verified shops
      isActive: true, // Only show active shops
    };

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
      // Add location filter to query
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      };
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
