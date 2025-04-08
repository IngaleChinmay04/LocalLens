import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await dbConnect();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = session.user.id;

    // Get form data from the request
    const formData = await request.formData();
    const shopId = formData.get("shopId");

    // Check if the shop belongs to the user
    const shop = await Shop.findOne({
      _id: shopId,
      ownerId: userId,
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Process image uploads if they exist
    const imageFiles = formData.getAll("images");
    const imageUrls = [];

    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        if (imageFile.size > 0) {
          const uploadResult = await uploadToCloudinary(
            imageFile,
            "product_images",
            `product_${shopId}_${Date.now()}_${i}`
          );
          imageUrls.push({
            url: uploadResult.secure_url,
            alt: formData.get("name"),
            isDefault: i === 0, // Make the first image the default
          });
        }
      }
    }

    // Parse the attributes if they exist
    let attributes = {};
    const attributesJson = formData.get("attributes");
    if (attributesJson) {
      try {
        attributes = JSON.parse(attributesJson);
      } catch (e) {
        console.error("Error parsing attributes:", e);
      }
    }

    // Parse variant attributes if they exist
    let variantAttributes = [];
    const variantAttributesJson = formData.get("variantAttributes");
    if (variantAttributesJson) {
      try {
        variantAttributes = JSON.parse(variantAttributesJson);
      } catch (e) {
        console.error("Error parsing variant attributes:", e);
      }
    }

    // Parse prebook config if it exists
    let preBookConfig = {};
    const preBookConfigJson = formData.get("preBookConfig");
    if (preBookConfigJson) {
      try {
        preBookConfig = JSON.parse(preBookConfigJson);
      } catch (e) {
        console.error("Error parsing prebook config:", e);
      }
    }

    // Create the product object
    const productData = {
      shopId,
      name: formData.get("name"),
      description: formData.get("description"),
      shortDescription: formData.get("shortDescription"),
      category: formData.get("category"),
      subcategory: formData.get("subcategory"),
      basePrice: parseFloat(formData.get("basePrice")),
      discountPercentage: parseFloat(formData.get("discountPercentage") || 0),
      tax: parseFloat(formData.get("tax") || 0),
      currency: formData.get("currency") || "INR",
      images: imageUrls,
      tags: formData.getAll("tags[]"),
      brand: formData.get("brand"),
      sku: formData.get("sku"),
      barcode: formData.get("barcode"),
      availableQuantity: parseInt(formData.get("availableQuantity") || 0),
      minOrderQuantity: parseInt(formData.get("minOrderQuantity") || 1),
      maxOrderQuantity: parseInt(formData.get("maxOrderQuantity") || 0),
      isAvailable: formData.get("isAvailable") === "true",
      isPreBookable: formData.get("isPreBookable") === "true",
      preBookConfig,
      attributes,
      hasVariants: formData.get("hasVariants") === "true",
      variantAttributes,
    };

    // Handle weight and dimensions if they exist
    if (formData.get("weightValue")) {
      productData.weight = {
        value: parseFloat(formData.get("weightValue")),
        unit: formData.get("weightUnit") || "g",
      };
    }

    if (formData.get("dimensionsLength")) {
      productData.dimensions = {
        length: parseFloat(formData.get("dimensionsLength")),
        width: parseFloat(formData.get("dimensionsWidth")),
        height: parseFloat(formData.get("dimensionsHeight")),
        unit: formData.get("dimensionsUnit") || "cm",
      };
    }

    // Create the product in the database
    const newProduct = await Product.create(productData);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
