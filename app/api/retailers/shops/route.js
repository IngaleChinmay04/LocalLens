// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";
// import Shop from "@/models/Shop.model";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// export async function GET(request) {
//   try {
//     await dbConnect();

//     // Get user session
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Get the user ID from the session
//     const userId = session.user.id;

//     // Check query parameter for verification status filter
//     const { searchParams } = new URL(request.url);
//     const verifiedOnly = searchParams.get("verified") === "true";

//     // Build the query
//     const query = { ownerId: userId };
//     if (verifiedOnly) {
//       query.verificationStatus = "verified";
//     }

//     // Fetch the shops
//     const shops = await Shop.find(query).sort({ createdAt: -1 }).lean();

//     // For each shop, fetch product and order counts
//     const shopsWithCounts = await Promise.all(
//       shops.map(async (shop) => {
//         // Get product count
//         const productCount = await mongoose.model("Product").countDocuments({
//           shopId: shop._id,
//         });

//         // Get order count where any item has this shop ID
//         const orderCount = await mongoose.model("Order").countDocuments({
//           "items.shopId": shop._id,
//         });

//         return {
//           ...shop,
//           productCount,
//           orderCount,
//         };
//       })
//     );

//     return NextResponse.json(shopsWithCounts);
//   } catch (error) {
//     console.error("Error fetching retailer shops:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch shops" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose"; // Added mongoose import

export async function GET(request) {
  try {
    await dbConnect();

    // Check query parameter for verification status filter and optional userId
    const { searchParams } = new URL(request.url);
    const verifiedOnly = searchParams.get("verified") === "true";

    // Get userId from query params - must be a valid MongoDB ObjectId
    const userIdParam = searchParams.get("userId");

    // Build the query based on what we have
    let query = {};

    // Only add ownerId to query if it's provided and valid
    if (userIdParam && mongoose.isValidObjectId(userIdParam)) {
      query.ownerId = userIdParam;
    }

    if (verifiedOnly) {
      query.verificationStatus = "verified";
    }

    // Fetch the shops - if no userId is provided, this will return all shops
    const shops = await Shop.find(query).sort({ createdAt: -1 }).lean();

    // If no shops found, return empty array instead of error
    if (!shops || shops.length === 0) {
      return NextResponse.json([]);
    }

    // For each shop, fetch product and order counts
    const shopsWithCounts = await Promise.all(
      shops.map(async (shop) => {
        // Get product count - handle case where Product model might not exist
        let productCount = 0;
        try {
          if (mongoose.models.Product) {
            productCount = await mongoose.models.Product.countDocuments({
              shopId: shop._id,
            });
          }
        } catch (err) {
          console.error("Error counting products:", err);
        }

        // Get order count - handle case where Order model might not exist
        let orderCount = 0;
        try {
          if (mongoose.models.Order) {
            orderCount = await mongoose.models.Order.countDocuments({
              "items.shopId": shop._id,
            });
          }
        } catch (err) {
          console.error("Error counting orders:", err);
        }

        return {
          ...shop,
          productCount,
          orderCount,
        };
      })
    );

    return NextResponse.json(shopsWithCounts);
  } catch (error) {
    console.error("Error fetching retailer shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
