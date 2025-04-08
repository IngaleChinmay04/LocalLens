import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import Shop from "@/models/Shop.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { orderId } = params;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = session.user.id;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if the user owns at least one shop that's in the order items
    const shopIds = [
      ...new Set(order.items.map((item) => item.shopId.toString())),
    ];

    // Find shops owned by the user that are in the order
    const userShops = await Shop.find({
      _id: { $in: shopIds },
      ownerId: userId,
    });

    if (userShops.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to update this order" },
        { status: 403 }
      );
    }

    // Get status data from the request
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "pending",
      "processing",
      "ready_for_pickup",
      "completed",
      "canceled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { orderStatus: status },
        $push: {
          statusUpdates: {
            status,
            timestamp: new Date(),
            updatedBy: userId,
          },
        },
      },
      { new: true }
    );

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
