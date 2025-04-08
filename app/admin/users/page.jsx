"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminUsersPage() {
  const [user, setUser] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
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
          <UserManagement />
        </div>
      </div>
    </>
  );
}
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  const fetchUsers = async (page = 1, limit = 10, role = "") => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      let url = `/api/users?page=${page}&limit=${limit}`;
      // if (role) {
      //   url += `&role=${role}`;
      // }

      // const headers = {
      //   "x-user-email": currentUser.email,
      // };

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      fetchUsers(pagination.page, pagination.limit, role);
    }
  }, [pagination.page, pagination.limit, role]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchUsers(newPage, pagination.limit, role);
    }
  };

  const handleRoleFilter = (selectedRole) => {
    setRole(selectedRole);
    fetchUsers(1, pagination.limit, selectedRole);
  };

  const handleDeleteUser = async (userId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmed) return;

    try {
      const headers = {
        "x-user-email": currentUser.email,
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete user");

      // Refresh user list
      fetchUsers(pagination.page, pagination.limit, role);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>

          <div className="flex space-x-2">
            <select
              value={role}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5"
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="retailer">Retailers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.displayName}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "retailer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="text-emerald-600 hover:underline mr-2"
                      >
                        Edit
                      </Link>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white border-b">
                  <td colSpan="6" className="px-6 py-4 text-center">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav aria-label="Page navigation">
              <ul className="inline-flex -space-x-px text-sm">
                <li>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight ${
                      pagination.hasPrevPage
                        ? "text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700"
                        : "text-gray-300 bg-gray-100 border border-gray-300 rounded-s-lg cursor-not-allowed"
                    }`}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(pagination.totalPages).keys()].map((page) => (
                  <li key={page + 1}>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      className={`flex items-center justify-center px-3 h-8 leading-tight ${
                        pagination.page === page + 1
                          ? "text-emerald-600 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      {page + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`flex items-center justify-center px-3 h-8 leading-tight ${
                      pagination.hasNextPage
                        ? "text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700"
                        : "text-gray-300 bg-gray-100 border border-gray-300 rounded-e-lg cursor-not-allowed"
                    }`}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
