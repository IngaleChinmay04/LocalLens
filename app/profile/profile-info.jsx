"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function ProfileInfo({ profile, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    phoneNumber: profile?.phoneNumber || "",
    preferences: {
      notificationEnabled: profile?.preferences?.notificationEnabled ?? true,
      emailSubscribed: profile?.preferences?.emailSubscribed ?? true,
      preferredCategories: profile?.preferences?.preferredCategories || [],
      maxDistance: profile?.preferences?.maxDistance || 10,
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("preferences.")) {
      const prefName = name.split(".")[1];
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          [prefName]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/users/${profile._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="md:flex md:items-center">
          <div className="flex-shrink-0 mr-4">
            {profile?.photoURL ? (
              <div className="relative h-24 w-24 rounded-full overflow-hidden">
                <Image
                  src={profile.photoURL}
                  alt={profile.displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                {profile?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.displayName}</h2>
            <p className="text-gray-500">{profile?.email}</p>
          </div>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="displayName"
                    id="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profile?.email}
                    disabled
                    className="shadow-sm bg-gray-100 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
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
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-4">
                  Preferences
                </h3>
                <div className="mt-3 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notificationEnabled"
                        name="preferences.notificationEnabled"
                        type="checkbox"
                        checked={formData.preferences.notificationEnabled}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="notificationEnabled"
                        className="font-medium text-gray-700"
                      >
                        Enable Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive notifications about your orders and account
                        activities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="emailSubscribed"
                        name="preferences.emailSubscribed"
                        type="checkbox"
                        checked={formData.preferences.emailSubscribed}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="emailSubscribed"
                        className="font-medium text-gray-700"
                      >
                        Subscribe to Email Updates
                      </label>
                      <p className="text-gray-500">
                        Receive emails about promotions, new products, and
                        events
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="maxDistance"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Distance (km)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="preferences.maxDistance"
                        id="maxDistance"
                        min="1"
                        max="100"
                        value={formData.preferences.maxDistance}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default distance for store searches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.displayName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Email Address
              </h3>
              <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Phone Number
              </h3>
              <p className="mt-1 text-sm text-gray-900">
                {profile?.phoneNumber || "Not set"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Account Type
              </h3>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {profile?.role}
              </p>
            </div>
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Preferences</h3>
              <div className="mt-1 space-y-2">
                <p className="text-sm text-gray-900">
                  Notifications:{" "}
                  {profile?.preferences?.notificationEnabled
                    ? "Enabled"
                    : "Disabled"}
                </p>
                <p className="text-sm text-gray-900">
                  Email Updates:{" "}
                  {profile?.preferences?.emailSubscribed
                    ? "Subscribed"
                    : "Unsubscribed"}
                </p>
                <p className="text-sm text-gray-900">
                  Maximum Distance: {profile?.preferences?.maxDistance || 10} km
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
