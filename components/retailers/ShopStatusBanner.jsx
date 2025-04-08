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
} from "lucide-react";

export default function ShopStatusBanner() {
  const { mongoUser } = useAuth();
  const [pendingShops, setPendingShops] = useState([]);
  const [rejectedShops, setRejectedShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchShopStatus() {
      try {
        const response = await fetch("/api/retailers/shops/status");

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
  }, [mongoUser]);

  if (isLoading || (!pendingShops.length && !rejectedShops.length)) {
    return null;
  }

  return (
    <div className="mb-6">
      {pendingShops.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {pendingShops.length} shop
                {pendingShops.length > 1 ? "s" : ""} pending verification. The
                admin will review your application soon.
              </p>
              <div className="mt-2">
                <Link
                  href="/retailer/shops"
                  className="text-sm font-medium text-yellow-700 hover:text-yellow-600 flex items-center"
                >
                  View details <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectedShops.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                You have {rejectedShops.length} shop
                {rejectedShops.length > 1 ? "s" : ""} that{" "}
                {rejectedShops.length > 1 ? "were" : "was"} rejected. Please
                review and resubmit with the correct information.
              </p>
              <div className="mt-2">
                <Link
                  href="/retailer/shops"
                  className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center"
                >
                  View details <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
