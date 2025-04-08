"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";

export default function CustomerDashboard() {
  const { user, mongoUser } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          Welcome, {user?.displayName}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Your Profile</h2>
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Role:</span> {mongoUser?.role}
            </p>
            <p>
              <span className="font-medium">Member Since:</span>{" "}
              {mongoUser?.createdAt
                ? new Date(mongoUser.createdAt).toLocaleDateString()
                : "N/A"}
            </p>

            <div className="mt-4">
              <Link
                href="/profile"
                className="text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-emerald-300 font-medium rounded-lg text-sm px-4 py-2 text-center"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-emerald-600 hover:underline"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shops"
                  className="text-emerald-600 hover:underline"
                >
                  Explore Local Shops
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
