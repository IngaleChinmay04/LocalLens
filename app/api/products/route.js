import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";
import mongoose from "mongoose";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function GET(request) {
  // Check if it's a public request for shop products or featured/trending products
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const featured = searchParams.get("featured") === "true";
  const trending = searchParams.get("trending") === "true";

  // Allow public access for shop products and featured/trending lists
  if (shopId || featured || trending) {
    return handleGetRequest(request);
  }

  // Otherwise require authentication
  return withFirebaseAuth(request, handleGetRequest, [
    "retailer",
    "admin",
    "customer",
  ]);
}

export async function POST(request) {
  return withFirebaseAuth(request, handlePostRequest, ["retailer", "admin"]);
}

// Update the GET handler in the products API to support location-based queries
async function handleGetRequest(request) {
  try {
    await dbConnect();

    // Parse URL params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const featured = searchParams.get("featured") === "true";
    const trending = searchParams.get("trending") === "true";
    const isFeatured = searchParams.get("isFeatured") === "true";
    const isTrending = searchParams.get("isTrending") === "true";
    const shopId = searchParams.get("shopId") || "";
    const lat = parseFloat(searchParams.get("lat")) || null;
    const lng = parseFloat(searchParams.get("lng")) || null;
    const radius = parseFloat(searchParams.get("radius")) || 5; // Default radius is 5km

    // Build query
    const query = {
      isActive: true,
      isAvailable: true,
    };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Shop filter
    if (shopId) {
      query.shopId = shopId;
    }

    // Featured products filter (handle both params)
    if (featured || isFeatured) {
      query.isFeatured = true;
    }

    // Trending products filter (handle both params)
    if (trending || isTrending) {
      query.isTrending = true;
    }

    // Location-based filter
    let shopQuery = {};
    if (lat && lng) {
      shopQuery = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radius * 1000, // Convert km to meters
          },
        },
        isActive: true,
        isVerified: true,
      };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    let products = [];
    let total = 0;

    // Handle different query types
    if (lat && lng && !shopId && !search && !category) {
      // Location-based query - get shops first, then products
      const Shop = mongoose.models.Shop;
      const nearbyShops = await Shop.find(shopQuery).select("_id").limit(10);
      const shopIds = nearbyShops.map((shop) => shop._id);

      query.shopId = { $in: shopIds };

      if (featured) {
        // Sort by rating for featured products
        products = await Product.find(query)
          .sort({ avgRating: -1, totalSales: -1 })
          .skip(skip)
          .limit(limit)
          .populate("shopId", "name logo");
      } else if (trending) {
        // Sort by sales for trending products
        products = await Product.find(query)
          .sort({ totalSales: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("shopId", "name logo");
      } else {
        // Default sort by distance (inherited from shops query)
        products = await Product.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("shopId", "name logo");
      }

      total = await Product.countDocuments(query);
    } else {
      // Standard query
      let sortOptions = {};

      if (search) {
        sortOptions = { score: { $meta: "textScore" } };
        query.$text = { $search: search };
      } else if (featured) {
        sortOptions = { avgRating: -1, totalSales: -1 };
      } else if (trending) {
        sortOptions = { totalSales: -1, createdAt: -1 };
      } else {
        sortOptions = { createdAt: -1 };
      }

      products = await Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("shopId", "name logo");

      total = await Product.countDocuments(query);
    }

    // Process products to include shopName
    const processedProducts = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.shopId) {
        productObj.shopName = productObj.shopId.name;
      }
      return productObj;
    });

    return NextResponse.json({
      products: processedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

async function handlePostRequest(request, user) {
  try {
    await dbConnect();

    // Parse the form data from the request
    const formData = await request.formData();

    // Get the shop ID
    const shopId = formData.get("shopId");

    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return NextResponse.json({ error: "Invalid shop ID" }, { status: 400 });
    }

    // Check if user owns the shop (for retailers)
    if (user.role === "retailer") {
      const shop = await Shop.findById(shopId).lean();

      if (!shop) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      }

      if (shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to add products to this shop" },
          { status: 403 }
        );
      }
    }

    // Create product data object
    const productData = {
      shopId,
      name: formData.get("name"),
      description: formData.get("description"),
      shortDescription: formData.get("shortDescription"),
      category: formData.get("category"),
      subcategory: formData.get("subcategory") || undefined,
      basePrice: parseFloat(formData.get("basePrice")),
      discountPercentage: parseFloat(formData.get("discountPercentage") || 0),
      tax: parseFloat(formData.get("tax") || 0),
      currency: formData.get("currency") || "INR",
      availableQuantity: parseInt(formData.get("availableQuantity"), 10),
      sku: formData.get("sku") || undefined,
      weight: formData.get("weight")
        ? parseFloat(formData.get("weight"))
        : undefined,
      dimensions: {
        length: formData.get("dimensions[length]")
          ? parseFloat(formData.get("dimensions[length]"))
          : undefined,
        width: formData.get("dimensions[width]")
          ? parseFloat(formData.get("dimensions[width]"))
          : undefined,
        height: formData.get("dimensions[height]")
          ? parseFloat(formData.get("dimensions[height]"))
          : undefined,
      },
      // Handle both isActive and isAvailable for consistency
      isActive: formData.get("isActive") === "true",
      isAvailable: formData.get("isAvailable") !== "false", // Default to true unless explicitly false
      tags: formData.get("tags") ? JSON.parse(formData.get("tags")) : [],
    };

    // Handle variants
    const hasVariants = formData.get("hasVariants") === "true";
    productData.hasVariants = hasVariants;

    if (hasVariants) {
      const variantTypesJson = formData.get("variantTypes");
      if (variantTypesJson) {
        try {
          productData.variantTypes = JSON.parse(variantTypesJson);

          // Extract variant attributes for compatibility with existing code
          const variantAttributes = productData.variantTypes.map((type) => {
            // Convert type names to match the enum in the schema
            let attributeType = type.name.toLowerCase();
            // Map to one of the allowed enum values
            if (
              !["color", "size", "material", "style"].includes(attributeType)
            ) {
              attributeType = "other";
            }
            return attributeType;
          });

          if (variantAttributes.length > 0) {
            productData.variantAttributes = [...new Set(variantAttributes)]; // Deduplicate attributes
          }

          // Initialize empty variants array
          productData.variants = [];
        } catch (e) {
          console.error("Error parsing variant types:", e);
        }
      }
    }

    // Handle pre-booking config
    const isPreBookable = formData.get("isPreBookable") === "true";
    productData.isPreBookable = isPreBookable;

    if (isPreBookable) {
      const preBookConfigJson = formData.get("preBookConfig");
      if (preBookConfigJson) {
        try {
          productData.preBookConfig = JSON.parse(preBookConfigJson);
        } catch (e) {
          console.error("Error parsing pre-book config:", e);
        }
      }
    }

    // Handle pre-buying config
    const isPreBuyable = formData.get("isPreBuyable") === "true";
    productData.isPreBuyable = isPreBuyable;

    if (isPreBuyable) {
      const preBuyConfigJson = formData.get("preBuyConfig");
      if (preBuyConfigJson) {
        try {
          productData.preBuyConfig = JSON.parse(preBuyConfigJson);
        } catch (e) {
          console.error("Error parsing pre-buy config:", e);
        }
      }
    }

    // Handle image uploads
    const imageFiles = formData.getAll("images");
    const images = [];

    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        if (file.size > 0) {
          const uniqueId = `product_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}`;
          try {
            const result = await uploadToCloudinary(
              file,
              "locallens/products",
              uniqueId
            );
            images.push({
              url: result.secure_url,
              publicId: result.public_id,
              alt: formData.get("name") || "Product Image",
              isDefault: images.length === 0, // First image is the default
            });
          } catch (err) {
            console.error("Image upload failed:", err);
          }
        }
      }
    }

    productData.images = images;

    // Create product
    const product = new Product(productData);
    await product.save();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product: " + error.message },
      { status: 500 }
    );
  }
}
