"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  RefreshCw,
  Store,
} from "lucide-react";

export default function ShopStatusBanner() {
  const { mongoUser, getIdToken } = useAuth();
  const [pendingShops, setPendingShops] = useState([]);
  const [rejectedShops, setRejectedShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchShopStatus() {
      try {
        // Get Firebase token
        const token = await getIdToken();

        if (!token) {
          console.error("No authentication token available");
          return;
        }

        const response = await fetch("/api/retailers/shops/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch shop status");
        }

        const data = await response.json();
        setPendingShops(data.pending);
        setRejectedShops(data.rejected);
      } catch (error) {
        console.error("Error fetching shop status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (mongoUser && mongoUser.role === "retailer") {
      fetchShopStatus();
    }
  }, [mongoUser, getIdToken]);

  if (isLoading || (!pendingShops.length && !rejectedShops.length)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {pendingShops.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-amber-800">
                  Shop Verification Pending
                </h3>
                <span className="text-xs bg-amber-200 text-amber-800 py-0.5 px-2 rounded-full">
                  {pendingShops.length}{" "}
                  {pendingShops.length > 1 ? "shops" : "shop"}
                </span>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                Your shop {pendingShops.length > 1 ? "s are" : " is"} currently
                under review. The admin will verify your application soon.
              </p>
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-amber-600">
                  This process typically takes 1-2 business days
                </p>
                <Link
                  href="/retailer/shops"
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 py-1 px-3 rounded-md flex items-center transition-colors"
                >
                  View details <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectedShops.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-red-800">
                  Shop Verification Rejected
                </h3>
                <span className="text-xs bg-red-200 text-red-800 py-0.5 px-2 rounded-full">
                  {rejectedShops.length}{" "}
                  {rejectedShops.length > 1 ? "shops" : "shop"}
                </span>
              </div>
              <p className="mt-1 text-sm text-red-700">
                Your application {rejectedShops.length > 1 ? "were" : "was"} not
                approved. Please review the feedback and resubmit with the
                correct information.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Link
                  href="/retailer/shops"
                  className="text-xs font-medium text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 py-1 px-3 rounded-md flex items-center transition-colors"
                >
                  View details <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
                <Link
                  href="/retailer/shops/new"
                  className="text-xs font-medium text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 py-1 px-3 rounded-md flex items-center transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Resubmit application
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
