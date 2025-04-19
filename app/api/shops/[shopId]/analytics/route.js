import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order.model";
import Product from "@/models/Product.model";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function GET(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      await dbConnect();

      const { shopId } = params;
      const { searchParams } = new URL(request.url);
      const timeRange = searchParams.get("timeRange") || "month";

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

      // Get date range based on timeRange
      const currentDate = new Date();
      let startDate;

      switch (timeRange) {
        case "week":
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date(currentDate);
          startDate.setMonth(currentDate.getMonth() - 1);
          break;
        case "year":
          startDate = new Date(currentDate);
          startDate.setFullYear(currentDate.getFullYear() - 1);
          break;
        case "all":
          startDate = new Date(0); // Beginning of time
          break;
        default:
          startDate = new Date(currentDate);
          startDate.setMonth(currentDate.getMonth() - 1);
      }

      // Get previous period for comparison
      const previousPeriodStart = new Date(startDate);
      const previousPeriodEnd = new Date(startDate);

      if (timeRange === "week") {
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      } else if (timeRange === "month") {
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      } else if (timeRange === "year") {
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
      }

      // Common time filter for current period
      const timeFilter = {
        createdAt: { $gte: startDate, $lte: currentDate },
      };

      // Common time filter for previous period
      const previousTimeFilter = {
        createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      };

      // Get orders for this shop in the current period
      const orders = await Order.find({
        "items.shopId": shopId,
        ...timeFilter,
      }).lean();

      // Get orders for this shop in the previous period
      const previousOrders = await Order.find({
        "items.shopId": shopId,
        ...previousTimeFilter,
      }).lean();

      // Calculate total revenue for current period
      let totalRevenue = 0;
      let productsSold = 0;
      let uniqueCustomers = new Set();

      orders.forEach((order) => {
        const shopItems = order.items.filter(
          (item) => item.shopId.toString() === shopId
        );
        shopItems.forEach((item) => {
          totalRevenue += item.totalPrice;
          productsSold += item.quantity;
        });
        uniqueCustomers.add(order.userId.toString());
      });

      // Calculate total revenue for previous period
      let previousTotalRevenue = 0;
      let previousProductsSold = 0;
      let previousUniqueCustomers = new Set();

      previousOrders.forEach((order) => {
        const shopItems = order.items.filter(
          (item) => item.shopId.toString() === shopId
        );
        shopItems.forEach((item) => {
          previousTotalRevenue += item.totalPrice;
          previousProductsSold += item.quantity;
        });
        previousUniqueCustomers.add(order.userId.toString());
      });

      // Calculate percent changes
      const calculatePercentChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return parseFloat((((current - previous) / previous) * 100).toFixed(2));
      };

      const revenuePercentChange = calculatePercentChange(
        totalRevenue,
        previousTotalRevenue
      );
      const ordersPercentChange = calculatePercentChange(
        orders.length,
        previousOrders.length
      );
      const productsSoldPercentChange = calculatePercentChange(
        productsSold,
        previousProductsSold
      );
      const customersPercentChange = calculatePercentChange(
        uniqueCustomers.size,
        previousUniqueCustomers.size
      );

      // Get top selling products
      const productSales = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.shopId.toString() === shopId) {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                id: item.productId,
                name: item.productSnapshot.name,
                quantity: 0,
                revenue: 0,
                category: item.productSnapshot.category,
                image:
                  item.productSnapshot.images &&
                  item.productSnapshot.images.length > 0
                    ? item.productSnapshot.images[0]
                    : null,
              };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.totalPrice;
          }
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Calculate percentage of total for each top product
      const totalProductQuantity = Object.values(productSales).reduce(
        (sum, product) => sum + product.quantity,
        0
      );
      topProducts.forEach((product) => {
        product.percentOfTotal = parseFloat(
          ((product.quantity / totalProductQuantity) * 100).toFixed(2)
        );
      });

      // Get sales by category
      const categorySales = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (
            item.shopId.toString() === shopId &&
            item.productSnapshot.category
          ) {
            const category = item.productSnapshot.category;
            if (!categorySales[category]) {
              categorySales[category] = {
                name: category,
                revenue: 0,
                orderCount: 0,
              };
            }
            categorySales[category].revenue += item.totalPrice;
            categorySales[category].orderCount++;
          }
        });
      });

      // Calculate percentage of total for each category
      const totalCategoryRevenue = Object.values(categorySales).reduce(
        (sum, category) => sum + category.revenue,
        0
      );
      const categoryBreakdown = Object.values(categorySales)
        .sort((a, b) => b.revenue - a.revenue)
        .map((category, index) => {
          // Assign different colors to different categories
          const colors = [
            "#10b981", // Emerald
            "#3b82f6", // Blue
            "#8b5cf6", // Indigo
            "#ec4899", // Pink
            "#f59e0b", // Amber
            "#ef4444", // Red
            "#06b6d4", // Cyan
          ];

          return {
            ...category,
            percentOfTotal: parseFloat(
              ((category.revenue / totalCategoryRevenue) * 100).toFixed(2)
            ),
            color: colors[index % colors.length],
          };
        });

      // Get sales over time
      const salesByDay = {};
      const salesByWeek = {};
      const salesByMonth = {};

      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const weekKey = `${date.getFullYear()}-W${Math.ceil(
          (date.getDate() +
            new Date(date.getFullYear(), date.getMonth(), 1).getDay()) /
            7
        )}`;
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        let orderTotal = 0;
        order.items.forEach((item) => {
          if (item.shopId.toString() === shopId) {
            orderTotal += item.totalPrice;
          }
        });

        // Add to daily sales
        if (!salesByDay[dayKey]) {
          salesByDay[dayKey] = { date: dayKey, revenue: 0, orders: 0 };
        }
        salesByDay[dayKey].revenue += orderTotal;
        salesByDay[dayKey].orders++;

        // Add to weekly sales
        if (!salesByWeek[weekKey]) {
          salesByWeek[weekKey] = { week: weekKey, revenue: 0, orders: 0 };
        }
        salesByWeek[weekKey].revenue += orderTotal;
        salesByWeek[weekKey].orders++;

        // Add to monthly sales
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { month: monthKey, revenue: 0, orders: 0 };
        }
        salesByMonth[monthKey].revenue += orderTotal;
        salesByMonth[monthKey].orders++;
      });

      // Convert sales objects to arrays and sort by date
      const dailySales = Object.values(salesByDay).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const weeklySales = Object.values(salesByWeek).sort((a, b) =>
        a.week.localeCompare(b.week)
      );
      const monthlySales = Object.values(salesByMonth).sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      // Choose time series data based on the time range
      let salesOverTime = [];
      if (timeRange === "week") {
        salesOverTime = dailySales;
      } else if (timeRange === "month") {
        salesOverTime = dailySales;
      } else if (timeRange === "year") {
        salesOverTime = monthlySales;
      } else {
        salesOverTime = monthlySales;
      }

      // Get recent activity
      const recentActivity = [];

      // Add recent orders
      const recentOrders = await Order.find({
        "items.shopId": shopId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentOrders.forEach((order) => {
        recentActivity.push({
          type: "order",
          description: `New order ${order.orderNumber} received`,
          timestamp: order.createdAt,
          id: order._id,
        });
      });

      // Add recent products
      const recentProducts = await Product.find({
        shopId,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      recentProducts.forEach((product) => {
        recentActivity.push({
          type: "product",
          description: `Product "${product.name}" added`,
          timestamp: product.createdAt,
          id: product._id,
        });
      });

      // Add recent reservations
      const recentReservations = await mongoose
        .model("Reservation")
        .find({
          shopId,
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      recentReservations.forEach((reservation) => {
        recentActivity.push({
          type: "reservation",
          description: `New reservation ${reservation.reservationNumber} created`,
          timestamp: reservation.createdAt,
          id: reservation._id,
        });
      });

      // Sort all activity by timestamp
      recentActivity.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Compile analytics data
      const analyticsData = {
        revenue: {
          total: totalRevenue,
          percentChange: revenuePercentChange,
        },
        orders: {
          total: orders.length,
          percentChange: ordersPercentChange,
        },
        productsSold: {
          total: productsSold,
          percentChange: productsSoldPercentChange,
        },
        customers: {
          total: uniqueCustomers.size,
          percentChange: customersPercentChange,
        },
        topProducts,
        categoryBreakdown,
        salesOverTime,
        recentActivity,
      };

      return NextResponse.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }
  });
}
