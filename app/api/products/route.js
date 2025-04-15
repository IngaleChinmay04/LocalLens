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
    console.log("[DEBUG] Starting product creation process");
    await dbConnect();

    // Parse the form data from the request
    const formData = await request.formData();

    // Get the shop ID
    const shopId = formData.get("shopId");
    console.log(`[DEBUG] Processing product creation for shop: ${shopId}`);

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

    console.log(`[DEBUG] Product data prepared: ${productData.name}`);

    // Handle variants
    const hasVariants = formData.get("hasVariants") === "true";
    productData.hasVariants = hasVariants;

    if (hasVariants) {
      console.log(`[DEBUG] Product has variants`);
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

          // Get variant data if available
          const variantsJson = formData.get("variants");
          if (variantsJson) {
            try {
              const variants = JSON.parse(variantsJson);
              productData.variants = variants;
              console.log(
                `[DEBUG] Parsed ${variants.length} variants from form data`
              );
            } catch (e) {
              console.error("[ERROR] Error parsing variants:", e);
            }
          }
        } catch (e) {
          console.error("[ERROR] Error parsing variant types:", e);
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
          console.error("[ERROR] Error parsing pre-book config:", e);
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
          console.error("[ERROR] Error parsing pre-buy config:", e);
        }
      }
    }

    // CRITICAL FIX: Handle main product image uploads
    console.log("[DEBUG] Starting image processing");
    const imageFiles = formData.getAll("images");
    console.log(
      `[DEBUG] Found ${imageFiles.length} image files in the form data`
    );

    const images = [];

    // Process image files
    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (file && file.size > 0) {
          try {
            console.log(
              `[DEBUG] Processing image file ${i + 1}/${
                imageFiles.length
              }: size=${file.size}, type=${file.type}`
            );
            // Create a unique ID based on timestamp and random string
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const uniqueId = `product_${timestamp}_${randomString}`;

            // DIRECT CLOUDINARY UPLOAD - bypassing our uploadToCloudinary function
            // This is a workaround to debug the issue
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append("file", file);
            cloudinaryFormData.append("folder", "locallens/products");
            cloudinaryFormData.append("public_id", uniqueId);
            cloudinaryFormData.append(
              "upload_preset",
              process.env.CLOUDINARY_UPLOAD_PRESET || "locallens_unsigned"
            );

            console.log(
              `[DEBUG] Preparing direct Cloudinary upload with preset: ${
                process.env.CLOUDINARY_UPLOAD_PRESET || "locallens_unsigned"
              }`
            );

            // Directly call Cloudinary's API
            const cloudinaryResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
              {
                method: "POST",
                body: cloudinaryFormData,
              }
            );

            if (!cloudinaryResponse.ok) {
              const errorText = await cloudinaryResponse.text();
              console.error(
                `[ERROR] Direct Cloudinary upload failed: ${errorText}`
              );
              throw new Error(`Cloudinary upload failed: ${errorText}`);
            }

            const result = await cloudinaryResponse.json();
            console.log(
              `[DEBUG] Successfully uploaded image ${
                i + 1
              } directly to Cloudinary: ${result.secure_url}`
            );

            images.push({
              url: result.secure_url,
              publicId: result.public_id,
              alt: productData.name || "Product Image",
              isDefault: images.length === 0, // First image is the default
            });
          } catch (err) {
            console.error(`[ERROR] Image ${i + 1} upload failed:`, err);
          }
        } else {
          console.log(
            `[DEBUG] Skipping empty or invalid image file at index ${i}`
          );
        }
      }
    } else {
      console.log("[DEBUG] No image files found in form data");
    }

    // Process any image URLs that might be passed directly
    const imageUrls = formData.getAll("imageUrls");
    console.log(
      `[DEBUG] Found ${imageUrls.length} direct image URLs in form data`
    );

    if (imageUrls && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (url && typeof url === "string" && url.trim() !== "") {
          console.log(
            `[DEBUG] Processing direct image URL ${i + 1}: ${url.substring(
              0,
              50
            )}...`
          );
          images.push({
            url: url,
            alt: productData.name || "Product Image",
            isDefault: images.length === 0, // First image is the default
          });
        }
      }
    }

    console.log(`[DEBUG] Total images processed: ${images.length}`);
    productData.images = images;

    // Handle variant image uploads if there are variants
    if (
      hasVariants &&
      productData.variants &&
      productData.variants.length > 0
    ) {
      console.log(
        `[DEBUG] Processing variant images for ${productData.variants.length} variants`
      );

      // Create a map to store variant images by index
      const variantImagesMap = new Map();

      // Process variant images from form data
      const variantImageFiles = formData.getAll("variantImages");
      const variantIndexes = formData.getAll("variantImageIndex");

      console.log(
        `[DEBUG] Found ${variantImageFiles.length} variant image files with ${variantIndexes.length} indexes`
      );

      // Upload all variant images
      for (let i = 0; i < variantImageFiles.length; i++) {
        const file = variantImageFiles[i];
        const variantIndex = variantIndexes[i] || "0";

        if (file && file.size > 0) {
          try {
            console.log(
              `[DEBUG] Processing variant image ${
                i + 1
              } for variant index ${variantIndex}`
            );
            const uniqueId = `variant_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 15)}`;

            const result = await uploadToCloudinary(
              file,
              "locallens/variants",
              uniqueId
            );

            if (result && result.secure_url) {
              // Initialize array for this variant if not already present
              if (!variantImagesMap.has(variantIndex)) {
                variantImagesMap.set(variantIndex, []);
              }

              // Add image to the variant's images array
              variantImagesMap.get(variantIndex).push({
                url: result.secure_url,
                publicId: result.public_id,
                alt: `${productData.name} Variant` || "Variant Image",
                isDefault: variantImagesMap.get(variantIndex).length === 0, // First image is default
              });

              console.log(
                `[DEBUG] Successfully uploaded variant image: ${result.secure_url}`
              );
            }
          } catch (err) {
            console.error(
              `[ERROR] Variant image upload failed for variant ${variantIndex}:`,
              err
            );
          }
        }
      }

      // Process any direct variant image URLs
      const variantImageUrls = formData.getAll("variantImageUrls");
      const variantUrlIndexes = formData.getAll("variantUrlIndex");

      console.log(
        `[DEBUG] Found ${variantImageUrls.length} direct variant image URLs`
      );

      for (let i = 0; i < variantImageUrls.length; i++) {
        const url = variantImageUrls[i];
        const variantIndex = variantUrlIndexes[i] || "0";

        if (url && typeof url === "string" && url.trim() !== "") {
          console.log(
            `[DEBUG] Processing direct variant image URL for variant ${variantIndex}: ${url.substring(
              0,
              50
            )}...`
          );

          // Initialize array for this variant if not already present
          if (!variantImagesMap.has(variantIndex)) {
            variantImagesMap.set(variantIndex, []);
          }

          // Add image URL to the variant's images array
          variantImagesMap.get(variantIndex).push({
            url: url,
            alt: `${productData.name} Variant` || "Variant Image",
            isDefault: variantImagesMap.get(variantIndex).length === 0, // First image is default
          });
        }
      }

      // Assign images to their respective variants
      console.log(
        `[DEBUG] Assigning images to variants: ${variantImagesMap.size} variant indexes with images`
      );
      for (const [index, images] of variantImagesMap.entries()) {
        const idx = parseInt(index, 10);
        if (idx >= 0 && idx < productData.variants.length) {
          productData.variants[idx].images = images;
          console.log(
            `[DEBUG] Assigned ${images.length} images to variant ${idx}`
          );
        }
      }

      // If no specific variant images were uploaded, use main product images for all variants
      if (variantImagesMap.size === 0 && images.length > 0) {
        console.log(
          `[DEBUG] No variant-specific images found, using main product images for all variants`
        );
        for (let i = 0; i < productData.variants.length; i++) {
          productData.variants[i].images = [...images];
          console.log(
            `[DEBUG] Assigned ${images.length} main product images to variant ${i}`
          );
        }
      }
    }

    // Create product
    console.log(
      `[DEBUG] Creating product in database with ${productData.images.length} images`
    );
    console.log(`[DEBUG] Product data preview:`, {
      name: productData.name,
      imageCount: productData.images.length,
      variantCount: productData.variants?.length || 0,
    });

    const product = new Product(productData);
    const savedProduct = await product.save();

    console.log(`[DEBUG] Product created successfully: ${savedProduct._id}`);
    console.log(
      `[DEBUG] Saved product has ${savedProduct.images.length} images and ${
        savedProduct.variants?.length || 0
      } variants`
    );

    if (savedProduct.images.length === 0) {
      console.warn("[WARN] Product was saved but has no images!");
    }

    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error("[ERROR] Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product: " + error.message },
      { status: 500 }
    );
  }
}
