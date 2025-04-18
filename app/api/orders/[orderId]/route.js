import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  const { orderId } = params;

  try {
    await dbConnect();

    // Get the authenticated user from the session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the order by ID and ensure it belongs to the authenticated user
    // or the user is an admin
    const userId = session.user.mongoUserId;
    const userRole = session.user.role;

    let query = { _id: orderId };

    // If user is not admin, they can only access their own orders
    if (userRole !== "admin") {
      // For retailers, they can also see orders for their shops
      if (userRole === "retailer") {
        query = {
          $or: [
            { _id: orderId, userId },
            { _id: orderId, "items.shopId": { $in: session.user.shops || [] } },
          ],
        };
      } else {
        // Regular customers can only see their own orders
        query = { _id: orderId, userId };
      }
    }

    const order = await Order.findOne(query)
      .populate("userId", "name email phone") // Populate user details
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or you don't have permission to view it" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
