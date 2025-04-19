"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Bell,
  AlertTriangle,
  CheckCircle,
  Save,
  Store,
  Settings,
  Globe,
  Clock,
  PencilLine,
  Calendar,
  Image,
  ToggleLeft,
  ToggleRight,
  LogOut,
} from "lucide-react";

export default function RetailerSettings() {
  const { mongoUser, updateUserProfile } = useAuth();

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    profileImage: "",
    location: "",
    storeTheme: "light",
    language: "english",
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      marketingEmails: false,
    },
  });

  // Load user data when component mounts
  useEffect(() => {
    if (mongoUser) {
      setFormData((prevState) => ({
        ...prevState,
        displayName: mongoUser.displayName || "",
        email: mongoUser.email || "",
        phoneNumber: mongoUser.phoneNumber || "",
        profileImage: mongoUser.profileImage || "",
        location: mongoUser.location || "",
      }));

      fetchUserShops();
    }
  }, [mongoUser]);

  // Fetch user's shops
  const fetchUserShops = async () => {
    if (!mongoUser?._id) return;

    try {
      const response = await fetch(`/api/shops?userId=${mongoUser._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }
      const data = await response.json();
      setShops(data.shops || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops information");
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle toggle changes for notification settings
  const handleToggleChange = (setting) => {
    setFormData((prevState) => ({
      ...prevState,
      notificationSettings: {
        ...prevState.notificationSettings,
        [setting]: !prevState.notificationSettings[setting],
      },
    }));
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setFormData((prevState) => ({
      ...prevState,
      storeTheme: prevState.storeTheme === "light" ? "dark" : "light",
    }));
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      language: e.target.value,
    }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.displayName.trim()) {
        throw new Error("Display name is required");
      }

      // Update profile in database
      await updateUserProfile({
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
      });

      // Save notification settings to database
      // This would normally be implemented with a separate API call

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // If no user data yet, show loading state
  if (!mongoUser) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-500">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-6 shadow-lg text-white">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Account Settings
        </h1>
        <p className="mt-2 text-emerald-50">
          Customize your experience and manage your account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Combined Profile Information - Left Column */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-emerald-100">
              <h2 className="text-lg font-medium text-gray-800 flex items-center">
                <User className="h-5 w-5 mr-2 text-emerald-600" />
                Profile Information
              </h2>
              <p className="text-sm text-gray-600">
                Update your personal information
              </p>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative mb-3">
                    <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-2 mx-auto relative overflow-hidden border-4 border-white shadow-md">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-emerald-500" />
                      )}
                      <button className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <PencilLine className="h-6 w-6 text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                      <Image className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="w-full px-2">
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium text-center mb-1">
                      Retailer
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div className="flex flex-col-reverse">
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="peer block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                        placeholder="Your full name"
                      />
                      <label
                        htmlFor="displayName"
                        className="block text-sm font-medium text-gray-700 mb-1 peer-focus:text-emerald-600 transition-colors duration-200"
                      >
                        Display Name
                      </label>
                    </div>

                    <div className="flex flex-col-reverse">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        readOnly
                        className="peer block w-full px-4 py-3 rounded-md border-gray-200 bg-gray-100 shadow-sm cursor-not-allowed text-gray-600"
                        placeholder="you@example.com"
                      />
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-500 mb-1"
                      >
                        Email Address (cannot be changed)
                      </label>
                    </div>

                    <div className="flex flex-col-reverse">
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="peer block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                        placeholder="+91 9876543210"
                      />
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1 peer-focus:text-emerald-600 transition-colors duration-200"
                      >
                        Phone Number
                      </label>
                    </div>

                    <div className="flex flex-col-reverse">
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="peer block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                        placeholder="Mumbai, Maharashtra"
                      />
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700 mb-1 peer-focus:text-emerald-600 transition-colors duration-200"
                      >
                        Location
                      </label>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Save Profile Information
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-2">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Account Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block">
                      Member Since
                    </span>
                    <span className="text-sm font-medium">
                      {mongoUser?.createdAt
                        ? new Date(mongoUser.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block">
                      Last Login
                    </span>
                    <span className="text-sm font-medium">
                      {mongoUser?.lastLogin
                        ? new Date(mongoUser.lastLogin).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block">Shops</span>
                    <span className="text-sm font-medium">
                      {shops.filter((shop) => shop.isActive).length || 0} Active
                      Shops
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences - Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
              <h2 className="text-lg font-medium text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Preferences
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <button
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                >
                  <span className="text-gray-600">
                    {formData.storeTheme === "light"
                      ? "Light Mode"
                      : "Dark Mode"}
                  </span>
                  {formData.storeTheme === "light" ? (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ToggleRight className="h-6 w-6 text-emerald-500" />
                  )}
                </button>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleLanguageChange}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="marathi">Marathi</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="tamil">Tamil</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-amber-100">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-amber-600" />
            Notification Settings
          </h2>
          <p className="text-sm text-gray-600">
            Manage how and when we contact you
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors">
              <div>
                <h3 className="font-medium text-gray-800">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive emails about your account activity and updates
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("emailNotifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notificationSettings.emailNotifications
                    ? "bg-emerald-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notificationSettings.emailNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors">
              <div>
                <h3 className="font-medium text-gray-800">
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive push notifications about important updates
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("pushNotifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notificationSettings.pushNotifications
                    ? "bg-emerald-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notificationSettings.pushNotifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors">
              <div>
                <h3 className="font-medium text-gray-800">Order Updates</h3>
                <p className="text-sm text-gray-500">
                  Receive notifications about new orders and order status
                  changes
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("orderUpdates")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notificationSettings.orderUpdates
                    ? "bg-emerald-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notificationSettings.orderUpdates
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors">
              <div>
                <h3 className="font-medium text-gray-800">Marketing Emails</h3>
                <p className="text-sm text-gray-500">
                  Receive promotional emails about new features and offers
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("marketingEmails")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notificationSettings.marketingEmails
                    ? "bg-emerald-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notificationSettings.marketingEmails
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleProfileUpdate}
                className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-colors duration-200"
              >
                <Bell className="h-5 w-5 mr-2" />
                Save Notification Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-5 border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100">
          <h2 className="text-lg font-medium text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Danger Zone
          </h2>
        </div>

        <div className="p-6">
          <div className="rounded-lg border border-red-200 overflow-hidden">
            <div className="p-5 bg-red-50 border-b border-red-200">
              <h3 className="font-medium text-red-800 flex items-center">
                Account Management
              </h3>
              <p className="mt-1 text-sm text-red-700">
                These actions are permanent and cannot be undone.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-800 font-medium">
                    Sign out from all devices
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sign out from all sessions except this one
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors">
                  Sign Out
                </button>
              </div>

              <div className="pt-2 border-t border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-700 font-medium">Delete Account</h4>
                    <p className="text-sm text-red-600">
                      Permanently delete your account and all your data
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
