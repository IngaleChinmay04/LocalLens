import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import Shop from "@/models/Shop.model";
import Order from "@/models/Order.model";
import Reservation from "@/models/Reservation.model";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    console.log("Admin dashboard API called");

    // Extract the token from the Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing authorization token");
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("Token received, attempting verification");

    try {
      // Verify the token directly using Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log("Token verified successfully, user:", decodedToken.email);

      await dbConnect();
      console.log("Database connected");

      // Define missing metrics variables
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // User metrics
      const userCount = await User.countDocuments({});
      const customerCount = await User.countDocuments({ role: "customer" });
      const retailerCount = await User.countDocuments({ role: "retailer" });
      const adminCount = await User.countDocuments({ role: "admin" });
      const newUsers = await User.countDocuments({
        createdAt: { $gte: oneWeekAgo },
      });

      // Shop metrics
      const shopCount = await Shop.countDocuments({});
      const verifiedShopCount = await Shop.countDocuments({ isVerified: true });
      const pendingShopCount = await Shop.countDocuments({ isVerified: null });
      const rejectedShopCount = await Shop.countDocuments({
        isVerified: false,
      });
      const newShops = await Shop.countDocuments({
        createdAt: { $gte: oneWeekAgo },
      });

      // Order metrics
      const orderCount = await Order.countDocuments({});
      const completedOrderCount = await Order.countDocuments({
        status: "completed",
      });
      const processingOrderCount = await Order.countDocuments({
        status: "processing",
      });
      const cancelledOrderCount = await Order.countDocuments({
        status: "cancelled",
      });

      // Reservation metrics
      const reservationCount = await Reservation.countDocuments({});
      const confirmedReservationCount = await Reservation.countDocuments({
        status: "confirmed",
      });
      const pendingReservationCount = await Reservation.countDocuments({
        status: "pending",
      });
      const cancelledReservationCount = await Reservation.countDocuments({
        status: "cancelled",
      });

      // Add pending shops data for the dashboard
      const pendingShops = await Shop.find({ isVerified: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name logo createdAt _id");

      console.log("Data gathered successfully, returning response");

      return NextResponse.json({
        userMetrics: {
          total: userCount,
          customers: customerCount,
          retailers: retailerCount,
          admins: adminCount,
          newLastWeek: newUsers,
        },
        shopMetrics: {
          total: shopCount,
          verified: verifiedShopCount,
          pending: pendingShopCount,
          rejected: rejectedShopCount,
          newLastWeek: newShops,
        },
        orderMetrics: {
          total: orderCount,
          completed: completedOrderCount,
          processing: processingOrderCount,
          cancelled: cancelledOrderCount,
        },
        reservationMetrics: {
          total: reservationCount,
          confirmed: confirmedReservationCount,
          pending: pendingReservationCount,
          cancelled: cancelledReservationCount,
        },
        // Add recent shops for the pending approvals section
        recentShops: pendingShops,
      });
    } catch (firebaseError) {
      console.error("Firebase auth error:", firebaseError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
