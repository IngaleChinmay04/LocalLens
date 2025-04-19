"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Tab } from "@headlessui/react";
import { useRouter } from "next/navigation";
import ProfileInfo from "./profile-info";
import AddressList from "./addresses/address-list";
import OrderHistory from "./orders/order-history";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ProfilePage() {
  const { user, loading, mongoUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to sign-in page
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    // If user is logged in, use mongoUser if available or fetch profile data
    if (user) {
      if (mongoUser) {
        setProfile(mongoUser);
        setLoadingProfile(false);
      } else {
        fetchUserProfile();
      }
    }
  }, [user, loading, router, mongoUser]);

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await fetch(`/api/users/email/${user.email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        <Tab.Group>
          <Tab.List className="flex border-b border-gray-200">
            <Tab
              className={({ selected }) =>
                classNames(
                  "px-6 py-3 text-sm font-medium focus:outline-none",
                  selected
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )
              }
            >
              Profile
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "px-6 py-3 text-sm font-medium focus:outline-none",
                  selected
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )
              }
            >
              Addresses
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "px-6 py-3 text-sm font-medium focus:outline-none",
                  selected
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )
              }
            >
              Orders
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="p-6">
              <ProfileInfo
                profile={profile}
                onProfileUpdate={fetchUserProfile}
              />
            </Tab.Panel>
            <Tab.Panel className="p-6">
              <AddressList userId={profile?._id} />
            </Tab.Panel>
            <Tab.Panel className="p-6">
              <OrderHistory />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
