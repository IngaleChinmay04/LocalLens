import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import Shop from "@/models/Shop.model";
import Product from "@/models/Product.model";
import Order from "@/models/Order.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    await dbConnect();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user stats
    const totalUsers = await User.countDocuments();
    const customerUsers = await User.countDocuments({ role: "customer" });
    const retailerUsers = await User.countDocuments({ role: "retailer" });

    // Get shop stats
    const totalShops = await Shop.countDocuments();
    const pendingShops = await Shop.countDocuments({
      verificationStatus: "pending",
    });
    const verifiedShops = await Shop.countDocuments({
      verificationStatus: "verified",
    });
    const rejectedShops = await Shop.countDocuments({
      verificationStatus: "rejected",
    });

    // Get product stats
    const totalProducts = await Product.countDocuments();

    // Get order stats
    const totalOrders = await Order.countDocuments();
    const pendingDeliveryOrders = await Order.countDocuments({
      orderStatus: { $in: ["pending", "processing", "ready_for_pickup"] },
    });

    // Get recent pending shops (for approval)
    const recentPendingShops = await Shop.find({
      verificationStatus: "pending",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const dashboardData = {
      users: {
        total: totalUsers,
        customers: customerUsers,
        retailers: retailerUsers,
      },
      shops: {
        total: totalShops,
        pending: pendingShops,
        verified: verifiedShops,
        rejected: rejectedShops,
      },
      products: {
        total: totalProducts,
      },
      orders: {
        total: totalOrders,
        pendingDelivery: pendingDeliveryOrders,
      },
      recentShops: recentPendingShops,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
