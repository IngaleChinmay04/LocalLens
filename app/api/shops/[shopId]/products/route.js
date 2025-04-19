import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function GET(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      await dbConnect();

      const { shopId } = params;

      // Validate shopId
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json({ error: "Invalid shop ID" }, { status: 400 });
      }

      // Get the user ID from Firebase auth middleware
      const userId = user._id;

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

      // Get products for this shop
      const products = await Product.find({ shopId })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      await dbConnect();

      const { shopId } = params;

      // Validate shopId
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json({ error: "Invalid shop ID" }, { status: 400 });
      }

      // Get the user ID from Firebase auth middleware
      const userId = user._id;

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

      // Get product data from the request
      const productData = await request.json();

      // Create the product
      const newProduct = await Product.create({
        ...productData,
        shopId,
      });

      return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }
  });
}
