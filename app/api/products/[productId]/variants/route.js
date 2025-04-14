import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handleGetRequest(req, user, productId),
    ["retailer", "admin", "customer"]
  );
}

export async function POST(request, { params }) {
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handlePostRequest(req, user, productId),
    ["retailer", "admin"]
  );
}

export async function PUT(request, { params }) {
  const productId = params.productId;
  return withFirebaseAuth(
    request,
    (req, user) => handlePutRequest(req, user, productId),
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
    if (user.role === "retailer") {
      const shop = await Shop.findById(product.shopId).lean();

      if (!shop || shop.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "You don't have permission to access this product" },
          { status: 403 }
        );
      }
    }

    if (!product.hasVariants) {
      return NextResponse.json(
        { error: "This product does not have variants" },
        { status: 400 }
      );
    }

    return NextResponse.json(product.variants || []);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

async function handlePostRequest(request, user, productId) {
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
          { error: "You don't have permission to modify this product" },
          { status: 403 }
        );
      }
    }

    if (!product.hasVariants) {
      return NextResponse.json(
        { error: "This product does not support variants" },
        { status: 400 }
      );
    }

    // Get variant data
    const body = await request.json();

    // Validate variant data
    if (!body.attributes || Object.keys(body.attributes).length === 0) {
      return NextResponse.json(
        { error: "Variant attributes are required" },
        { status: 400 }
      );
    }

    // Check if the variant already exists
    const exists =
      product.variants &&
      product.variants.some((variant) => {
        // Compare each attribute
        const variantAttrs = Object.keys(variant.attributes);
        const newAttrs = Object.keys(body.attributes);

        if (variantAttrs.length !== newAttrs.length) {
          return false;
        }

        return variantAttrs.every(
          (key) =>
            newAttrs.includes(key) &&
            variant.attributes[key] === body.attributes[key]
        );
      });

    if (exists) {
      return NextResponse.json(
        { error: "A variant with these attributes already exists" },
        { status: 400 }
      );
    }

    // Create new variant
    const newVariant = {
      variantId: new mongoose.Types.ObjectId(),
      attributes: body.attributes,
      price: body.price || product.basePrice,
      discountPercentage:
        body.discountPercentage || product.discountPercentage || 0,
      availableQuantity: body.availableQuantity || 0,
      sku:
        body.sku ||
        `${product.sku || product._id}-${Object.values(body.attributes).join(
          "-"
        )}`,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    // Add variant to product
    if (!product.variants) {
      product.variants = [];
    }

    product.variants.push(newVariant);
    product.updatedAt = new Date();

    await product.save();

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant: " + error.message },
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
          { error: "You don't have permission to modify this product" },
          { status: 403 }
        );
      }
    }

    // Get variants data
    const { variants } = await request.json();

    if (!Array.isArray(variants)) {
      return NextResponse.json(
        { error: "Invalid variants data" },
        { status: 400 }
      );
    }

    // Update variants
    product.variants = variants;
    product.updatedAt = new Date();

    await product.save();

    return NextResponse.json(product.variants);
  } catch (error) {
    console.error("Error updating variants:", error);
    return NextResponse.json(
      { error: "Failed to update variants: " + error.message },
      { status: 500 }
    );
  }
}
