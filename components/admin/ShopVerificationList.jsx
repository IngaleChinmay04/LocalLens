"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Store,
  Check,
  X,
  ChevronDown,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Info,
  FileText,
  User,
} from "lucide-react";

export default function ShopVerificationList() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedShopId, setExpandedShopId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("pending");

  useEffect(() => {
    fetchShops();
  }, [selectedTab]);

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/shops?status=${selectedTab}`);

      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }

      const data = await response.json();
      console.log("Fetched shops:", data);
      setShops(data);
    } catch (error) {
      toast.error("Error loading shops");
      console.error("Error fetching shops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveShop = async (shopId) => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "verified" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve shop");
      }

      toast.success("Shop approved successfully");
      fetchShops();
    } catch (error) {
      toast.error("Error approving shop");
      console.error("Error approving shop:", error);
    }
  };

  const handleRejectShop = async (shopId) => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject shop");
      }

      toast.success("Shop rejected");
      fetchShops();
    } catch (error) {
      toast.error("Error rejecting shop");
      console.error("Error rejecting shop:", error);
    }
  };

  const toggleExpandShop = (shopId) => {
    if (expandedShopId === shopId) {
      setExpandedShopId(null);
    } else {
      setExpandedShopId(shopId);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading shops...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setSelectedTab("pending")}
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === "pending"
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setSelectedTab("verified")}
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === "verified"
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setSelectedTab("rejected")}
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === "rejected"
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No shops found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {selectedTab === "pending"
              ? "There are no shops waiting for approval."
              : selectedTab === "verified"
              ? "No shops have been approved yet."
              : "No shops have been rejected."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {shops.map((shop) => (
            <div key={shop._id} className="hover:bg-gray-50">
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpandShop(shop._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {shop.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                        <span className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {shop.address?.city}, {shop.address?.state}
                        </span>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {shop.owner?.email || "Unknown owner"}
                        </span>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span>Submitted on {formatDate(shop.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {selectedTab === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveShop(shop._id);
                          }}
                          className="text-white bg-emerald-600 hover:bg-emerald-700 rounded-md px-3 py-1.5 text-sm font-medium flex items-center mr-2"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectShop(shop._id);
                          }}
                          className="text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 text-sm font-medium flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 ml-2 transform transition-transform ${
                        expandedShopId === shop._id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {expandedShopId === shop._id && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Business Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex">
                          <Mail className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {shop.contactEmail}
                          </span>
                        </div>
                        <div className="flex">
                          <Phone className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {shop.contactPhone}
                          </span>
                        </div>
                        {shop.website && (
                          <div className="flex">
                            <ExternalLink className="h-5 w-5 text-gray-400 mr-2" />
                            <a
                              href={shop.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {shop.website}
                            </a>
                          </div>
                        )}
                        <div className="flex">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            GSTIN: {shop.gstin}
                          </span>
                        </div>
                        {shop.registrationNumber && (
                          <div className="flex">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              Reg. Number: {shop.registrationNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </h4>
                      <div className="text-sm text-gray-900">
                        <p>{shop.address?.addressLine1}</p>
                        {shop.address?.addressLine2 && (
                          <p>{shop.address.addressLine2}</p>
                        )}
                        <p>
                          {shop.address?.city}, {shop.address?.state}{" "}
                          {shop.address?.postalCode}
                        </p>
                        <p>{shop.address?.country}</p>
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Coordinates
                        </h5>
                        <p className="text-sm text-gray-900">
                          {shop.location?.coordinates[1]},{" "}
                          {shop.location?.coordinates[0]}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Categories & Documents
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Categories
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {shop.categories?.map((category, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        {shop.verificationDocument && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                              Verification Document
                            </h5>
                            <a
                              href={shop.verificationDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Shop Description
                    </h4>
                    <p className="text-sm text-gray-900">{shop.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
