"use server";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    let orders = [];

    // Customers see their own orders
    if (session.user.role === "customer") {
      orders = await Order.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .populate("userId", "name email");
    }
    // Retailers see orders for their shops
    else if (session.user.role === "retailer") {
      const shopIds = session.user.shops || [];

      // Find orders that contain items from the retailer's shops
      orders = await Order.find({
        "items.shopId": { $in: shopIds },
      })
        .sort({ createdAt: -1 })
        .populate("userId", "name email");

      // For retailers, we'll filter out items that don't belong to their shops
      // This way they only see their own products in each order
      orders = orders.map((order) => {
        // Only include items from the retailer's shops
        const retailerItems = order.items.filter((item) =>
          shopIds.includes(item.shopId.toString())
        );

        // Create a modified order object with just the retailer's items
        const orderForRetailer = {
          ...order.toObject(),
          items: retailerItems,
          // Calculate totals just for this retailer's items
          subtotal: retailerItems.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          ),
        };

        return orderForRetailer;
      });
    }
    // Admins see all orders
    else if (session.user.role === "admin") {
      orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate("userId", "name email");
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}

// Create a new order
export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();

    // Generate unique order number
    const date = new Date();
    const dateStr =
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const randomStr = Math.floor(10000 + Math.random() * 90000);
    data.orderNumber = `LL-${dateStr}-${randomStr}`;

    // Add initial status update
    data.statusUpdates = [
      {
        status: data.orderStatus || "pending",
        timestamp: new Date(),
        notes: "Order placed",
      },
    ];

    const order = await Order.create(data);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
