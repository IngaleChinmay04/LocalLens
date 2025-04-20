"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import BannerManagement from "@/components/admin/BannerManagement";
import Link from "next/link";

export default function AdminBannersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/admin/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="mb-6">Please login to access admin panel.</p>
        <Link
          href="/admin/login"
          className="text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar user={user} />
      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Banner Management</h1>
            <p className="text-gray-600">
              Manage promotional banners for the home page
            </p>
          </div>

          <BannerManagement />
        </div>
      </div>
    </>
  );
}
