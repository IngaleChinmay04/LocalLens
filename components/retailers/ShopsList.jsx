"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  Clock,
  XCircle,
  Store,
  Edit,
  Package,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Loader2,
  PlusCircle,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function ShopsList() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
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
  }, [user, getIdToken]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full absolute top-3 right-3">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full absolute top-3 right-3">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full absolute top-3 right-3">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const filteredShops = shops.filter((shop) => {
    // Filter by status
    if (filter !== "all" && shop.verificationStatus !== filter) {
      return false;
    }
    // Filter by search term
    if (
      searchTerm &&
      !shop.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-gray-500">Loading your shops...</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
        <div className="bg-gray-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Store className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No shops yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You don&apos;t have any shops registered. Create your first shop to
          start selling products locally.
        </p>
        <Link
          href="/retailer/shops/new"
          className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Register New Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              filter === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } transition-colors`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
              filter === "verified"
                ? "bg-green-700 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            } transition-colors`}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Verified
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
              filter === "pending"
                ? "bg-amber-700 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            } transition-colors`}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
              filter === "rejected"
                ? "bg-red-700 text-white"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            } transition-colors`}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Rejected
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm"
          />
        </div>
      </div>

      {filteredShops.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <Filter className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No matching shops
          </h3>
          <p className="text-gray-600 mb-4">
            No shops match your current filters. Try adjusting your search
            criteria.
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setSearchTerm("");
            }}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div
              key={shop._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-36 bg-gradient-to-r from-emerald-500 to-emerald-700 relative">
                {shop.coverImage && (
                  <img
                    src={shop.coverImage}
                    alt={`${shop.name} cover`}
                    className="h-full w-full object-cover opacity-60"
                  />
                )}
                {getStatusBadge(shop.verificationStatus)}

                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={`${shop.name} logo`}
                    className="absolute bottom-0 left-4 w-20 h-20 rounded-lg border-4 border-white bg-white object-cover transform translate-y-1/2 shadow-md"
                  />
                ) : (
                  <div className="absolute bottom-0 left-4 w-20 h-20 rounded-lg border-4 border-white bg-gray-100 flex items-center justify-center transform translate-y-1/2 shadow-md">
                    <Store className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="pt-14 px-4 pb-4">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {shop.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {shop.description || "No description available"}
                </p>

                <div className="space-y-2">
                  {shop.address && (
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 line-clamp-1">
                        {typeof shop.address === "string"
                          ? shop.address
                          : `${shop.address.addressLine1}${
                              shop.address.addressLine2
                                ? `, ${shop.address.addressLine2}`
                                : ""
                            }, ${shop.address.city}, ${shop.address.state} ${
                              shop.address.postalCode
                            }, ${shop.address.country}`}
                      </span>
                    </div>
                  )}

                  {shop.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{shop.phoneNumber}</span>
                    </div>
                  )}

                  {shop.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 line-clamp-1">
                        {shop.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="font-semibold text-gray-800">
                      {shop.productCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-semibold text-gray-800">
                      {shop.orderCount || 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {shop.categories?.slice(0, 3).map((category, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                  {shop.categories?.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      +{shop.categories.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {shop.verificationStatus === "verified" ? (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                  <Link
                    href={`/retailer/shops/${shop._id}`}
                    className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md flex items-center hover:bg-emerald-200 transition-colors flex-1 justify-center"
                  >
                    <Store className="w-4 h-4 mr-1" />
                    Manage
                  </Link>
                  <Link
                    href={`/retailer/shops/${shop._id}/products`}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md flex items-center hover:bg-blue-200 transition-colors flex-1 justify-center"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Products
                  </Link>
                  <Link
                    href={`/retailer/shops/${shop._id}/orders`}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md flex items-center hover:bg-purple-200 transition-colors flex-1 justify-center"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Orders
                  </Link>
                </div>
              ) : shop.verificationStatus === "pending" ? (
                <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Awaiting verification from admin
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-red-700 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      Registration rejected
                    </p>
                    <Link
                      href={`/retailer/shops/${shop._id}/edit`}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md flex items-center transition-colors"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit & Resubmit
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Link
          href="/retailer/shops/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-md shadow-sm flex items-center transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Register New Shop
        </Link>
      </div>
    </div>
  );
}
