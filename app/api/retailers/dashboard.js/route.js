import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop.model";
import Order from "@/models/Order.model";
import Reservation from "@/models/Reservation.model";
import Product from "@/models/Product.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await dbConnect();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
    const userId = session.user.id;

    // Get shops
    const shops = await Shop.find({ ownerId: userId });
    const shopIds = shops.map((shop) => shop._id);

    // Count verified and pending shops
    const verifiedShops = shops.filter(
      (shop) => shop.verificationStatus === "verified"
    ).length;
    const pendingShops = shops.filter(
      (shop) => shop.verificationStatus === "pending"
    ).length;

    // Get all orders for these shops
    const orders = await Order.find({ "items.shopId": { $in: shopIds } });

    // Count orders by status
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "pending"
    ).length;
    const processingOrders = orders.filter(
      (order) => order.orderStatus === "processing"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "completed"
    ).length;

    // Get all reservations for these shops
    const reservations = await Reservation.find({ shopId: { $in: shopIds } });

    // Count reservations by status
    const pendingReservations = reservations.filter(
      (res) => res.status === "pending"
    ).length;
    const confirmedReservations = reservations.filter(
      (res) => res.status === "confirmed"
    ).length;
    const readyReservations = reservations.filter(
      (res) => res.status === "ready"
    ).length;

    // Get all products for these shops
    const products = await Product.find({ shopId: { $in: shopIds } });

    // Count low stock products (less than 5 units)
    const lowStockProducts = products.filter(
      (product) => product.availableQuantity < 5
    ).length;

    // Calculate revenue
    let totalRevenue = 0;
    let todayRevenue = 0;
    let thisWeekRevenue = 0;
    let thisMonthRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    orders.forEach((order) => {
      // Only count completed orders
      if (order.orderStatus === "completed") {
        // Get items for shops owned by the user
        const shopItems = order.items.filter((item) =>
          shopIds.some((id) => id.toString() === item.shopId.toString())
        );

        // Sum up the revenue
        const orderRevenue = shopItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        totalRevenue += orderRevenue;

        // Check if order is from today
        if (new Date(order.createdAt) >= today) {
          todayRevenue += orderRevenue;
        }

        // Check if order is from this week
        if (new Date(order.createdAt) >= weekStart) {
          thisWeekRevenue += orderRevenue;
        }

        // Check if order is from this month
        if (new Date(order.createdAt) >= monthStart) {
          thisMonthRevenue += orderRevenue;
        }
      }
    });

    // Get recent activity (last 10 events)
    const recentActivity = [];

    // Recent orders (last 5)
    const recentOrders = await Order.find({ "items.shopId": { $in: shopIds } })
      .sort({ createdAt: -1 })
      .limit(5);

    recentOrders.forEach((order) => {
      recentActivity.push({
        type: "order",
        message: `New order #${order.orderNumber} received`,
        timestamp: order.createdAt,
        link: `/retailer/orders/${order._id}`,
      });
    });

    // Recent reservations (last 5)
    const recentReservations = await Reservation.find({
      shopId: { $in: shopIds },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    recentReservations.forEach((reservation) => {
      recentActivity.push({
        type: "reservation",
        message: `New reservation #${reservation.reservationNumber} created`,
        timestamp: reservation.createdAt,
        link: `/retailer/reservations/${reservation._id}`,
      });
    });

    // Recent shop status changes (last 5)
    shops.forEach((shop) => {
      if (shop.verificationStatus === "verified" && shop.verificationDate) {
        recentActivity.push({
          type: "shop",
          message: `Shop "${shop.name}" has been verified`,
          timestamp: shop.verificationDate,
          link: `/retailer/shops/${shop._id}`,
        });
      } else if (shop.verificationStatus === "pending") {
        recentActivity.push({
          type: "shop",
          message: `Shop "${shop.name}" is pending verification`,
          timestamp: shop.createdAt,
          link: `/retailer/shops/${shop._id}`,
        });
      }
    });

    // Sort all activity by timestamp (most recent first) and take the latest 10
    recentActivity.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const latestActivity = recentActivity.slice(0, 10);

    // Dashboard data
    const dashboardData = {
      shops: {
        total: shops.length,
        verified: verifiedShops,
        pending: pendingShops,
      },
      orders: {
        total: orders.length,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
      },
      reservations: {
        total: reservations.length,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        ready: readyReservations,
      },
      products: {
        total: products.length,
        lowStock: lowStockProducts,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisWeek: thisWeekRevenue,
        thisMonth: thisMonthRevenue,
      },
      recentActivity: latestActivity,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
