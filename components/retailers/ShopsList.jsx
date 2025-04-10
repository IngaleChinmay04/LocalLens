"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
// import { useSession } from "next-auth/react";
import {
  CheckCircle,
  Clock,
  XCircle,
  Store,
  Edit,
  Package,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function ShopsList() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // const { data: session } = useSession();
  // Inside your component:
  const { user, getIdToken } = useAuth();

  useEffect(() => {
    async function fetchShops() {
      try {
        setIsLoading(true);

        // Get Firebase token
        const token = await getIdToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch("/api/retailers/shops", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }

        const data = await response.json();
        console.log("Shops data:", data);
        // setShops(data);
        // Check if data is an array, or extract the array from the response
        if (Array.isArray(data)) {
          setShops(data);
        } else if (data && typeof data === "object") {
          // If data is an object, try to find an array property (common patterns)
          // Adjust the property name based on your API response structure
          setShops(data.shops || data.data || data.results || []);
        } else {
          // Fallback to empty array if data is not valid
          setShops([]);
        }
      } catch (error) {
        toast.error(error.message || "An error occurred while fetching shops");
        console.error("Error fetching shops:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchShops();
    }
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex items-center text-sm font-medium text-green-700 bg-green-100 px-2.5 py-0.5 rounded">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-sm font-medium text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center text-sm font-medium text-red-700 bg-red-100 px-2.5 py-0.5 rounded">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="flex justify-center mb-4">
          <Store className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shops yet</h3>
        <p className="text-gray-600 mb-4">
          You don&apos;t have any shops registered. Create your first shop to
          start selling.
        </p>
        <Link
          href="/retailer/shops/new"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded"
        >
          Register New Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <div
            key={shop._id}
            className="bg-white rounded-lg shadow overflow-hidden border border-gray-200"
          >
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-700 relative">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={`${shop.name} logo`}
                  className="absolute bottom-0 left-4 w-20 h-20 rounded-lg border-4 border-white bg-white object-cover transform translate-y-1/2"
                />
              ) : (
                <div className="absolute bottom-0 left-4 w-20 h-20 rounded-lg border-4 border-white bg-gray-100 flex items-center justify-center transform translate-y-1/2">
                  <Store className="w-10 h-10 text-gray-400" />
                </div>
              )}
              {getStatusBadge(shop.verificationStatus)}
            </div>

            <div className="pt-12 px-4 pb-4">
              <h3 className="font-bold text-xl mb-1">{shop.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {shop.description || "No description available"}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Products</p>
                  <p className="font-semibold">{shop.productCount || 0}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="font-semibold">{shop.orderCount || 0}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {shop.categories?.map((category, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {shop.verificationStatus === "verified" ? (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                <Link
                  href={`/retailer/shops/${shop._id}`}
                  className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center hover:bg-emerald-200"
                >
                  <Store className="w-4 h-4 mr-1" />
                  Manage
                </Link>
                <Link
                  href={`/retailer/shops/${shop._id}/products`}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center hover:bg-blue-200"
                >
                  <Package className="w-4 h-4 mr-1" />
                  Products
                </Link>
                <Link
                  href={`/retailer/shops/${shop._id}/orders`}
                  className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center hover:bg-purple-200"
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Orders
                </Link>
              </div>
            ) : shop.verificationStatus === "pending" ? (
              <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
                <p className="text-sm text-yellow-700 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Awaiting verification from admin
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-700 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  Registration rejected. Please contact support.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/retailer/shops/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <Store className="w-5 h-5 mr-2" />
          Register New Shop
        </Link>
      </div>
    </div>
  );
}
