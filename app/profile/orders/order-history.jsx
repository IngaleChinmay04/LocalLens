"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/context/AuthContext";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      // Enhanced error handling for different response formats
      let ordersList = [];

      // Case 1: Direct array of orders
      if (Array.isArray(data)) {
        ordersList = data;
      }
      // Case 2: Object with orders array property
      else if (data && Array.isArray(data.orders)) {
        ordersList = data.orders;
      }
      // Case 3: Object with pagination and orders array
      else if (data && data.pagination && Array.isArray(data.orders)) {
        ordersList = data.orders;
      }
      // Case 4: Another format - log for debugging
      else {
        console.warn("Unexpected orders data format:", data);
        // Try to extract orders if data is an object but not in expected format
        if (data && typeof data === "object") {
          // Check if any property is an array that might contain orders
          for (const key in data) {
            if (
              Array.isArray(data[key]) &&
              data[key].length > 0 &&
              data[key][0].orderNumber
            ) {
              ordersList = data[key];
              break;
            }
          }
        }
      }

      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load order history");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      ready_for_pickup: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };

    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          No Orders Yet
        </h3>
        <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Order History</h2>
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center mt-2 sm:mt-0">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus.replace(/_/g, " ")}
                  </span>
                  <Link
                    href={`/orders/${order._id}`}
                    className="mt-2 sm:mt-0 sm:ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {order.items.slice(0, 2).map((item) => (
                      <li key={item._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 h-16 w-16 relative">
                            {item.productSnapshot?.images &&
                            item.productSnapshot.images[0] ? (
                              <Image
                                src={item.productSnapshot.images[0]}
                                alt={item.productSnapshot.name}
                                fill
                                className="object-cover rounded-md"
                                sizes="64px"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No image
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.productSnapshot.name}
                            </p>
                            {item.variantSnapshot && (
                              <p className="text-sm text-gray-500">
                                {Object.entries(
                                  item.variantSnapshot.attributes || {}
                                )
                                  .filter(([_, value]) => value)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(", ")}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × ₹
                              {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {order.items.length > 2 && (
                    <div className="pt-3 text-center">
                      <p className="text-sm text-gray-500">
                        +{order.items.length - 2} more{" "}
                        {order.items.length - 2 === 1 ? "item" : "items"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    Shop:{" "}
                    {order.items[0].shopSnapshot?.name || "Multiple Shops"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Total: ₹{order.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Paid Online"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
