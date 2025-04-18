"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import AddressForm from "./address-form";

export default function AddressList({ userId }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/addresses?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (addressData) => {
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...addressData,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add address");
      }

      toast.success("Address added successfully");
      fetchAddresses();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const handleUpdateAddress = async (addressId, addressData) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        throw new Error("Failed to update address");
      }

      toast.success("Address updated successfully");
      fetchAddresses();
      setEditingAddress(null);
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default address");
      }

      toast.success("Default address updated");
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  if (loading && !showAddForm && !editingAddress) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Addresses</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Add New Address
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-6 mb-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Add New Address</h3>
          <AddressForm
            onSubmit={handleAddAddress}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingAddress && (
        <div className="bg-gray-50 p-6 mb-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Edit Address</h3>
          <AddressForm
            initialData={editingAddress}
            onSubmit={(data) => handleUpdateAddress(editingAddress._id, data)}
            onCancel={() => setEditingAddress(null)}
          />
        </div>
      )}

      {!addresses.length && !showAddForm ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">
            You don't have any saved addresses yet.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white rounded-lg shadow p-4 border-2 ${
                address.isDefault ? "border-indigo-500" : "border-transparent"
              }`}
            >
              {address.isDefault && (
                <div className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block">
                  Default
                </div>
              )}
              <div className="mb-2">
                <p className="text-lg font-semibold">{address.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {address.label}
                </p>
              </div>
              <p className="text-gray-600">{address.phoneNumber}</p>
              <p className="text-gray-600">{address.addressLine1}</p>
              {address.addressLine2 && (
                <p className="text-gray-600">{address.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="text-gray-600">{address.country}</p>

              {address.instructions && (
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium">Delivery Instructions:</p>
                  <p>{address.instructions}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-3">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => setEditingAddress(address)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(address._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
