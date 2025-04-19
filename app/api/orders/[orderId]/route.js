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

      // Ensure orderStatus has a valid value
      if (!order.orderStatus) {
        order.orderStatus = "pending";
      }

      // Ensure status updates all have valid status values and are consistent with the main orderStatus
      if (order.statusUpdates && Array.isArray(order.statusUpdates)) {
        // Make sure all status updates have a valid status
        order.statusUpdates = order.statusUpdates.map((update) => ({
          ...update,
          status: update.status || "pending",
        }));

        // If there are status updates, make sure the main orderStatus matches the most recent status
        if (order.statusUpdates.length > 0) {
          // Sort status updates by timestamp in descending order to get the most recent
          const sortedUpdates = [...order.statusUpdates].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );

          // Ensure the main orderStatus matches the most recent status update
          order.orderStatus = sortedUpdates[0].status;
        }
        // If no status updates but we have an orderStatus, add a status update with the current orderStatus
        else if (order.orderStatus) {
          order.statusUpdates = [
            {
              status: order.orderStatus,
              timestamp: order.createdAt || new Date(),
              notes: "Order placed",
            },
          ];
        }
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
