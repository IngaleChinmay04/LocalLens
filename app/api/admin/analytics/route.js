import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import Shop from "@/models/Shop.model";
import Order from "@/models/Order.model";
import Product from "@/models/Product.model";
import Reservation from "@/models/Reservation.model";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper function to get date ranges
function getDateRanges() {
  const today = new Date();

  // Last 7 days
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  // Last 30 days
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  // Last 90 days
  const last90Days = new Date(today);
  last90Days.setDate(today.getDate() - 90);

  // Last 6 months
  const last6Months = new Date(today);
  last6Months.setMonth(today.getMonth() - 6);

  // Last year
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);

  return {
    today,
    last7Days,
    last30Days,
    last90Days,
    last6Months,
    lastYear,
  };
}

// Generate timestamps for each day in the last 30 days
function generateLast30DaysTimestamps() {
  const dates = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
}

export async function GET(request) {
  try {
    console.log("Admin platform analytics API called");

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

    try {
      // Verify the token directly using Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log("Token verified successfully, user:", decodedToken.email);

      await dbConnect();
      const dateRanges = getDateRanges();
      const last30DaysTimestamps = generateLast30DaysTimestamps();

      // Get user growth over time
      const userGrowthData = await Promise.all(
        last30DaysTimestamps.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);

          const count = await User.countDocuments({
            createdAt: { $gte: date, $lt: nextDay },
          });

          return {
            date: date.toISOString().split("T")[0],
            count,
          };
        })
      );

      // Get user distribution by role
      const totalUsers = await User.countDocuments({});
      const customerCount = await User.countDocuments({ role: "customer" });
      const retailerCount = await User.countDocuments({ role: "retailer" });
      const adminCount = await User.countDocuments({ role: "admin" });

      const userDistribution = [
        {
          role: "Customers",
          count: customerCount,
          percentage: ((customerCount / totalUsers) * 100).toFixed(1),
        },
        {
          role: "Retailers",
          count: retailerCount,
          percentage: ((retailerCount / totalUsers) * 100).toFixed(1),
        },
        {
          role: "Admins",
          count: adminCount,
          percentage: ((adminCount / totalUsers) * 100).toFixed(1),
        },
      ];

      // Get shop verification stats
      const totalShops = await Shop.countDocuments({});
      const verifiedShops = await Shop.countDocuments({ isVerified: true });
      const pendingShops = await Shop.countDocuments({ isVerified: false });

      const shopVerificationStats = [
        {
          status: "Verified",
          count: verifiedShops,
          percentage: ((verifiedShops / totalShops) * 100).toFixed(1),
        },
        {
          status: "Pending",
          count: pendingShops,
          percentage: ((pendingShops / totalShops) * 100).toFixed(1),
        },
      ];

      // Get order status distribution
      const totalOrders = await Order.countDocuments({});
      const pendingOrders = await Order.countDocuments({ status: "pending" });
      const processingOrders = await Order.countDocuments({
        status: "processing",
      });
      const shippedOrders = await Order.countDocuments({ status: "shipped" });
      const deliveredOrders = await Order.countDocuments({
        status: "delivered",
      });
      const completedOrders = await Order.countDocuments({
        status: "completed",
      });
      const cancelledOrders = await Order.countDocuments({
        status: "cancelled",
      });

      const orderStatusDistribution = [
        {
          status: "Pending",
          count: pendingOrders,
          percentage: ((pendingOrders / totalOrders) * 100).toFixed(1),
        },
        {
          status: "Processing",
          count: processingOrders,
          percentage: ((processingOrders / totalOrders) * 100).toFixed(1),
        },
        {
          status: "Shipped",
          count: shippedOrders,
          percentage: ((shippedOrders / totalOrders) * 100).toFixed(1),
        },
        {
          status: "Delivered",
          count: deliveredOrders,
          percentage: ((deliveredOrders / totalOrders) * 100).toFixed(1),
        },
        {
          status: "Completed",
          count: completedOrders,
          percentage: ((completedOrders / totalOrders) * 100).toFixed(1),
        },
        {
          status: "Cancelled",
          count: cancelledOrders,
          percentage: ((cancelledOrders / totalOrders) * 100).toFixed(1),
        },
      ];

      // Get order growth over time
      const orderGrowthData = await Promise.all(
        last30DaysTimestamps.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);

          const count = await Order.countDocuments({
            createdAt: { $gte: date, $lt: nextDay },
          });

          return {
            date: date.toISOString().split("T")[0],
            count,
          };
        })
      );

      // Get revenue data (estimated from orders)
      const revenueData = await Promise.all(
        last30DaysTimestamps.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);

          const orders = await Order.find({
            createdAt: { $gte: date, $lt: nextDay },
          });

          const dailyRevenue = orders.reduce((total, order) => {
            return total + (order.totalAmount || 0);
          }, 0);

          return {
            date: date.toISOString().split("T")[0],
            amount: dailyRevenue,
          };
        })
      );

      // Get platform activity metrics
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const activityMetrics = {
        newUsers24h: await User.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
        newShops24h: await Shop.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
        newOrders24h: await Order.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
        newProducts24h: await Product.countDocuments({
          createdAt: { $gte: last24Hours },
        }),
      };

      // Get top product categories across platform
      const products = await Product.find().lean();
      const categoryCounts = {};

      products.forEach((product) => {
        if (product.category) {
          if (categoryCounts[product.category]) {
            categoryCounts[product.category]++;
          } else {
            categoryCounts[product.category] = 1;
          }
        }
      });

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: ((count / products.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return NextResponse.json({
        userAnalytics: {
          growth: userGrowthData,
          distribution: userDistribution,
          total: totalUsers,
        },
        shopAnalytics: {
          verificationStats: shopVerificationStats,
          total: totalShops,
        },
        orderAnalytics: {
          statusDistribution: orderStatusDistribution,
          growth: orderGrowthData,
          total: totalOrders,
        },
        revenueAnalytics: {
          byDay: revenueData,
          // Calculate total revenue from daily data
          total: revenueData.reduce((sum, day) => sum + day.amount, 0),
        },
        activityMetrics,
        productAnalytics: {
          topCategories,
          total: products.length,
        },
      });
    } catch (firebaseError) {
      console.error("Firebase auth error:", firebaseError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in platform analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform analytics data" },
      { status: 500 }
    );
  }
}
