import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import Shop from "@/models/Shop.model";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function GET(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    const { orderId } = params;

    try {
      await dbConnect();

      // Find the order by ID
      const userId = user._id;
      const userRole = user.role;

      let query = { _id: orderId };

      // If user is not admin, they can only access their own orders
      if (userRole !== "admin") {
        // For retailers, they can also see orders for their shops
        if (userRole === "retailer") {
          // Get shops owned by this user
          const shops = await Shop.find({ ownerId: userId });
          const shopIds = shops.map((shop) => shop._id);

          query = {
            $or: [
              { _id: orderId, userId },
              { _id: orderId, "items.shopId": { $in: shopIds } },
            ],
          };
        } else {
          // Regular customers can only see their own orders
          query = { _id: orderId, userId };
        }
      }

      const order = await Order.findOne(query)
        .populate("userId", "displayName email phoneNumber") // Populate user details
        .lean();

      if (!order) {
        return NextResponse.json(
          { error: "Order not found or you don't have permission to view it" },
          { status: 404 }
        );
      }

      // For retailers, filter items to only show those from their shops
      if (
        userRole === "retailer" &&
        userRole !== "admin" &&
        order.userId.toString() !== userId.toString()
      ) {
        const shops = await Shop.find({ ownerId: userId });
        const shopIds = shops.map((shop) => shop._id.toString());

        // Filter items to only include those from the retailer's shops
        order.items = order.items.filter((item) =>
          shopIds.includes(item.shopId.toString())
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
  });
}
