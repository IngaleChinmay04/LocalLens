"use client";

import { useState, useEffect } from "react";

export default function AddressForm({ initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    label: initialData.label || "home",
    name: initialData.name || "",
    phoneNumber: initialData.phoneNumber || "",
    addressLine1: initialData.addressLine1 || "",
    addressLine2: initialData.addressLine2 || "",
    city: initialData.city || "",
    state: initialData.state || "",
    postalCode: initialData.postalCode || "",
    country: initialData.country || "India",
    isDefault: initialData.isDefault || false,
    instructions: initialData.instructions || "",
    location: initialData.location || {
      type: "Point",
      coordinates: [0, 0], // Default coordinates
    },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update form if initialData changes
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({
        label: initialData.label || "home",
        name: initialData.name || "",
        phoneNumber: initialData.phoneNumber || "",
        addressLine1: initialData.addressLine1 || "",
        addressLine2: initialData.addressLine2 || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postalCode: initialData.postalCode || "",
        country: initialData.country || "India",
        isDefault: initialData.isDefault || false,
        instructions: initialData.instructions || "",
        location: initialData.location || {
          type: "Point",
          coordinates: [0, 0],
        },
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field when user makes a change
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^[0-9+\s-]{10,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Enter a valid phone number";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line 1 is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^[0-9]{6}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = "Enter a valid 6-digit postal code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // TODO: Geocode the address to get coordinates
      // For now, just use dummy coordinates if none exist
      if (
        !formData.location.coordinates[0] &&
        !formData.location.coordinates[1]
      ) {
        formData.location = {
          type: "Point",
          coordinates: [77.209, 28.6139], // Default to Delhi coordinates
        };
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.name
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <div className="mt-1">
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.phoneNumber
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
              placeholder="+91 9876543210"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-6">
          <label
            htmlFor="label"
            className="block text-sm font-medium text-gray-700"
          >
            Address Type
          </label>
          <div className="mt-1">
            <select
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-6">
          <label
            htmlFor="addressLine1"
            className="block text-sm font-medium text-gray-700"
          >
            Address Line 1
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="addressLine1"
              id="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.addressLine1
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
              placeholder="Street address, P.O. box, company name"
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-6">
          <label
            htmlFor="addressLine2"
            className="block text-sm font-medium text-gray-700"
          >
            Address Line 2 (Optional)
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="addressLine2"
              id="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            City
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.city
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700"
          >
            State
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.state
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700"
          >
            Postal Code
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="postalCode"
              id="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.postalCode
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-6">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700"
          >
            Country
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="country"
              id="country"
              value={formData.country}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              readOnly
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <label
            htmlFor="instructions"
            className="block text-sm font-medium text-gray-700"
          >
            Delivery Instructions (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="instructions"
              name="instructions"
              rows={3}
              value={formData.instructions}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Specific instructions for delivery, landmarks, etc."
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isDefault"
                name="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isDefault" className="font-medium text-gray-700">
                Set as default address
              </label>
              <p className="text-gray-500">
                This address will be used as your default shipping address
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            "Save Address"
          )}
        </button>
      </div>
    </form>
  );
}
