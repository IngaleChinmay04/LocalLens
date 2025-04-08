"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ClipboardList,
  Search,
  Filter,
  Check,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

export default function ReservationManagement({ shopId }) {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchShops() {
      try {
        const response = await fetch("/api/retailers/shops?verified=true");

        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }

        const data = await response.json();
        setShops(data);

        // If no shopId was provided but user has shops, select the first one
        if (!shopId && data.length > 0) {
          setSelectedShop(data[0]._id);
        }
      } catch (error) {
        toast.error("Error fetching shops");
        console.error("Error fetching shops:", error);
      }
    }

    fetchShops();
  }, [shopId]);

  useEffect(() => {
    async function fetchReservations() {
      if (!selectedShop) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/shops/${selectedShop}/reservations`);

        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }

        const data = await response.json();
        setReservations(data);
      } catch (error) {
        toast.error("Error fetching reservations");
        console.error("Error fetching reservations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReservations();
  }, [selectedShop]);

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
    router.push(`/retailer/reservations?shopId=${e.target.value}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      searchTerm === "" ||
      reservation.reservationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "" || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewReservation = (reservationId) => {
    router.push(`/retailer/reservations/${reservationId}`);
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reservation status");
      }

      setReservations(
        reservations.map((reservation) =>
          reservation._id === reservationId
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );

      toast.success(`Reservation status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating reservation status");
      console.error("Error updating reservation status:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Confirmed
          </span>
        );
      case "ready":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Ready for Pickup
          </span>
        );
      case "completed":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      case "expired":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeSlot = (slot) => {
    return `${slot.start} - ${slot.end}`;
  };

  if (shops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Verified Shops
        </h3>
        <p className="text-gray-600 mb-4">
          You need at least one verified shop to manage reservations.
        </p>
        <button
          onClick={() => router.push("/retailer/shops")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded"
        >
          Go to My Shops
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-gray-600">Manage your customer pre-bookings</p>
        </div>

        <div>
          <select
            value={selectedShop}
            onChange={handleShopChange}
            className="p-2 border rounded bg-white"
          >
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by reservation number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border rounded-md"
              />
            </div>

            <div className="w-full md:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No reservations found
            </h3>
            <p className="text-gray-500">
              {reservations.length === 0
                ? "You haven't received any pre-bookings yet."
                : "No reservations match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reservation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ClipboardList className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.reservationNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reservation.items.length} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reservation.contactInfo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.contactInfo.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(reservation.pickupDate)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        {formatTimeSlot(reservation.pickupTimeSlot)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{reservation.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.paymentStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewReservation(reservation._id)}
                          className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                        >
                          View
                        </button>

                        {reservation.status === "pending" && (
                          <button
                            onClick={() =>
                              updateReservationStatus(
                                reservation._id,
                                "confirmed"
                              )
                            }
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirm
                          </button>
                        )}

                        {reservation.status === "confirmed" && (
                          <button
                            onClick={() =>
                              updateReservationStatus(reservation._id, "ready")
                            }
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark Ready
                          </button>
                        )}

                        {reservation.status === "ready" && (
                          <button
                            onClick={() =>
                              updateReservationStatus(
                                reservation._id,
                                "completed"
                              )
                            }
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </button>
                        )}

                        {["pending", "confirmed"].includes(
                          reservation.status
                        ) && (
                          <button
                            onClick={() =>
                              updateReservationStatus(
                                reservation._id,
                                "cancelled"
                              )
                            }
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 flex items-center"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
