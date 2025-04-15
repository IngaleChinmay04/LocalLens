import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export async function GET(request, { params }) {
  // Make productId access explicit
  const productId = params.productId;

  // Also handle public access for individual product viewing
  if (request.headers.get("x-public-access") === "true") {
    return handleGetRequest(request, { role: "public" }, productId);
  }

  return withFirebaseAuth(
    request,
    (req, user) => handleGetRequest(req, user, productId),
    ["retailer", "admin", "customer"]
  );
}

export async function PUT(request, { params }) {
  // Make productId access explicit
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handlePutRequest(req, user, productId),
    ["retailer", "admin"]
  );
}

export async function PATCH(request, { params }) {
  // Make productId access explicit
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handlePatchRequest(req, user, productId),
    ["retailer", "admin"]
  );
}

export async function DELETE(request, { params }) {
  // Make productId access explicit
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handleDeleteRequest(req, user, productId),
    ["retailer", "admin"]
  );
}

async function handleGetRequest(request, user, productId) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // For retailers, check if they own the shop that has this product
    if (user && user.role === "retailer") {
      const shop = await Shop.findById(product.shopId).lean();

      if (!shop || shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to access this product" },
          { status: 403 }
        );
      }
    }

    // For customers, check if product is active
    if ((user && user.role === "customer") || user?.role === "public") {
      if (!product.isActive) {
        return NextResponse.json(
          { error: "Product not available" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

async function handlePutRequest(request, user, productId) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Get the existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check ownership
    if (user.role === "retailer") {
      const shop = await Shop.findById(existingProduct.shopId).lean();

      if (!shop || shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to modify this product" },
          { status: 403 }
        );
      }
    }

    // Handle form data
    const formData = await request.formData();

    // Build the update object
    const productData = {
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
      // Handle both isActive and isAvailable consistently
      isActive: formData.get("isActive") === "true",
      isAvailable: formData.get("isAvailable") !== "false", // Default to true unless explicitly false
      tags: formData.get("tags")
        ? JSON.parse(formData.get("tags"))
        : existingProduct.tags,
      updatedAt: new Date(),
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

          // Don't reset variants array during update, as it would remove existing variants
          // Just ensure it exists if needed
          if (
            !existingProduct.variants ||
            !Array.isArray(existingProduct.variants)
          ) {
            productData.variants = [];
          }
        } catch (e) {
          console.error("Error parsing variant types:", e);
        }
      }
    } else {
      // If variants are disabled, clear variant types
      productData.variantTypes = [];
      productData.variantAttributes = [];
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
    } else {
      // Clear pre-book config if disabled
      productData.preBookConfig = undefined;
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
    } else {
      // Clear pre-buy config if disabled
      productData.preBuyConfig = undefined;
    }

    // Handle images
    const imageFiles = formData.getAll("images");
    const existingImagesJson = formData.get("existingImages");
    let existingImages = [];

    if (existingImagesJson) {
      try {
        existingImages = JSON.parse(existingImagesJson);
      } catch (e) {
        console.error("Error parsing existing images:", e);
      }
    }

    // Find images to delete (images in the database but not in existingImages)
    const imagesToDelete = existingProduct.images.filter(
      (dbImage) =>
        !existingImages.some((img) => img.publicId === dbImage.publicId)
    );

    // Delete removed images from Cloudinary
    for (const image of imagesToDelete) {
      if (image.publicId) {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch (err) {
          console.error(
            `Failed to delete image ${image.publicId} from Cloudinary:`,
            err
          );
        }
      }
    }

    // Upload new images if any
    const newImages = [];
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        if (file.size > 0) {
          const uniqueId = `product_${productId}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}`;
          try {
            const result = await uploadToCloudinary(
              file,
              "locallens/products",
              uniqueId
            );
            newImages.push({
              url: result.secure_url,
              publicId: result.public_id,
              alt: productData.name || "Product Image",
              isDefault: existingImages.length === 0 && newImages.length === 0, // First image is default if no others exist
            });
          } catch (err) {
            console.error("Image upload failed:", err);
          }
        }
      }
    }

    // Combine existing and new images
    productData.images = [...existingImages, ...newImages];

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: productData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product: " + error.message },
      { status: 500 }
    );
  }
}

async function handlePatchRequest(request, user, productId) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Get the existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check ownership
    if (user.role === "retailer") {
      const shop = await Shop.findById(existingProduct.shopId).lean();

      if (!shop || shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to modify this product" },
          { status: 403 }
        );
      }
    }

    // Get patch data
    const body = await request.json();
    body.updatedAt = new Date();

    // Handle special case for isActive/isAvailable to keep them in sync
    if (
      body.hasOwnProperty("isActive") &&
      !body.hasOwnProperty("isAvailable")
    ) {
      body.isAvailable = body.isActive;
    }
    if (
      body.hasOwnProperty("isAvailable") &&
      !body.hasOwnProperty("isActive")
    ) {
      body.isActive = body.isAvailable;
    }

    // Apply updates
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

async function handleDeleteRequest(request, user, productId) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Get the product
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check ownership
    if (user.role === "retailer") {
      const shop = await Shop.findById(product.shopId).lean();

      if (!shop || shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to delete this product" },
          { status: 403 }
        );
      }
    }

    // Delete product images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await deleteFromCloudinary(image.publicId);
          } catch (err) {
            console.error(
              `Failed to delete image ${image.publicId} from Cloudinary:`,
              err
            );
          }
        }
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
