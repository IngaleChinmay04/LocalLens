"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { auth } from "@/lib/firebase"; // Import Firebase auth directly
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  RefreshCw,
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, mongoUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        router.push("/signin");
        return;
      }

      try {
        // Get the Firebase ID token directly from the Firebase auth instance
        const token = await auth.currentUser.getIdToken(true);

        console.log("Firebase auth token obtained, length:", token.length);

        const response = await fetch("/api/orders", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache", // Prevent caching
          },
        });

        console.log("API response status:", response.status);

        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText = errorData.error || `Error: ${response.status}`;
          } catch (e) {
            errorText =
              (await response.text()) || `Unknown error: ${response.status}`;
          }

          console.error("API error:", errorText);
          throw new Error(errorText);
        }

        const data = await response.json();
        console.log("Orders data received, count:", data?.length || 0);
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError(`Failed to load orders: ${error.message}`);
        toast.error("Failed to load orders. Please try refreshing the page.");

        // Automatically retry once if this might be a token issue
        if (retryCount === 0) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => {
            console.log("Retrying fetch after error...");
            fetchOrders();
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, router, retryCount]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Package className="w-3 h-3 mr-1" />
            Ready for Pickup
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Orders
        </h3>
        <p className="text-gray-500 text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Orders Yet
        </h3>
        <p className="text-gray-500 text-center mb-6">
          You haven't placed any orders yet. Start shopping to see your orders
          here.
        </p>
        <Link
          href="/shops"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Your Orders
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your order history
        </p>
      </div>

      <ul className="divide-y divide-gray-200">
        {orders.map((order) => (
          <li key={order._id} className="hover:bg-gray-50">
            <Link href={`/orders/${order._id}`}>
              <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-emerald-600 truncate">
                      Order #{order.orderNumber}
                    </p>
                    <div className="ml-3">
                      {getStatusBadge(order.orderStatus)}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between sm:block">
                    <div className="flex items-center text-sm text-gray-500">
                      <p className="truncate">{formatDate(order.createdAt)}</p>
                      <p className="ml-4 truncate hidden sm:block">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 sm:mt-0">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex flex-shrink-0 ml-0 sm:ml-4">
                  <div className="hidden sm:flex -space-x-2 mr-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 relative rounded-full ring-2 ring-white overflow-hidden"
                      >
                        {item.productSnapshot.images &&
                        item.productSnapshot.images[0] ? (
                          <Image
                            src={item.productSnapshot.images[0]}
                            alt={item.productSnapshot.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 ring-2 ring-white">
                        <span className="text-xs font-medium text-gray-500">
                          +{order.items.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
