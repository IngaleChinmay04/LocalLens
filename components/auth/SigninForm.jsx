"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function SignInForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("customer");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const router = useRouter();
  const { googleSignIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      if (!showRoleSelection) {
        // First click - show role selection
        setShowRoleSelection(true);
        return;
      }

      // Second click - proceed with sign in
      setError("");
      setLoading(true);
      await googleSignIn(selectedRole);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sign In
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showRoleSelection && (
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">
            I am a:
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="role"
                value="customer"
                checked={selectedRole === "customer"}
                onChange={() => setSelectedRole("customer")}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="ml-3">
                <span className="block text-gray-800 font-medium">
                  Customer
                </span>
                <span className="block text-gray-500 text-sm">
                  I want to shop from local retailers
                </span>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="role"
                value="retailer"
                checked={selectedRole === "retailer"}
                onChange={() => setSelectedRole("retailer")}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="ml-3">
                <span className="block text-gray-800 font-medium">
                  Retailer
                </span>
                <span className="block text-gray-500 text-sm">
                  I want to sell my products
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mb-4"
      >
        <Image
          src="/google.png"
          width={20}
          height={20}
          alt="Google"
          className="mr-2"
        />
        {loading
          ? "Signing in..."
          : showRoleSelection
          ? "Continue with Google"
          : "Sign in with Google"}
      </button>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-emerald-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-emerald-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
