"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Settings, UserPlus, User, Shield, Mail } from "lucide-react";

export default function AdminSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchAdminUsers(user);
      } else {
        router.push("/admin/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAdminUsers = async (currentUser) => {
    setLoadingAdmins(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/admin/users?role=admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
      } else {
        toast.error("Failed to fetch admin users");
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast.error("Error loading admin users");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreatedUserCredentials(null); // Reset any previous credentials
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/users/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Admin user created successfully");
        // Store the credentials to display them
        setCreatedUserCredentials({
          email: newAdminEmail,
          temporaryPassword: data.temporaryPassword,
          resetLink: data.resetLink,
        });
        setNewAdminEmail("");
        setNewAdminPassword("");
        fetchAdminUsers(user);
      } else {
        toast.error(data.error || "Failed to create admin user");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      toast.error("Error creating admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold">Admin Settings</h1>
            <p className="text-gray-600">
              Manage admin access and application settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Admin Users Management */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-emerald-600 mr-2" />
                  <h2 className="text-xl font-semibold">Admin Users</h2>
                </div>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-md"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {showCreateForm ? "Cancel" : "Add Admin"}
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-md font-medium mb-3">
                    Create New Admin User
                  </h3>
                  <form onSubmit={handleCreateAdmin}>
                    <div className="flex flex-col gap-3">
                      <div className="flex-grow">
                        <label htmlFor="adminEmail" className="sr-only">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="adminEmail"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5"
                            placeholder="Email address"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <label htmlFor="adminPassword" className="sr-only">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          </div>
                          <input
                            type="password"
                            id="adminPassword"
                            value={newAdminPassword}
                            onChange={(e) =>
                              setNewAdminPassword(e.target.value)
                            }
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5"
                            placeholder="Password"
                            minLength="6"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isSubmitting || !newAdminEmail || !newAdminPassword
                        }
                        className="text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                      >
                        {isSubmitting ? (
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
                            Creating...
                          </>
                        ) : (
                          "Create Admin"
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      This will create a new admin user with the provided email
                      and password.
                    </p>
                  </form>
                </div>
              )}

              {createdUserCredentials && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center mb-3">
                    <svg
                      className="h-5 w-5 text-green-700 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-md font-medium text-green-800">
                      Admin User Created Successfully
                    </h3>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-green-700 mb-1">
                      Admin account has been created for:
                    </p>
                    <p className="text-sm font-semibold text-green-800">
                      {createdUserCredentials.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Password Reset Link (if needed):
                    </p>
                    <div className="flex items-center">
                      <div className="bg-white px-3 py-1 rounded border border-green-200 text-sm max-w-full overflow-x-auto">
                        <code className="font-mono text-xs break-all">
                          {createdUserCredentials.resetLink}
                        </code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            createdUserCredentials.resetLink
                          );
                          toast.success("Reset link copied to clipboard");
                        }}
                        className="ml-2 flex-shrink-0 text-xs bg-white text-green-700 hover:bg-green-100 px-2 py-1 rounded border border-green-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-green-700">
                    The admin can now log in using the provided email and
                    password. The reset link is available if they need to reset
                    their password.
                  </p>
                </div>
              )}

              {loadingAdmins ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <User className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-gray-500 text-lg">
                    No admin users found
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Create your first admin user above
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((admin) => (
                        <tr
                          key={admin._id || admin.email}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Settings Sidebar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <Settings className="h-5 w-5 text-emerald-600 mr-2" />
                <h2 className="text-xl font-semibold">Settings</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                  <h3 className="font-medium text-gray-900">Admin Accounts</h3>
                  <p className="text-sm text-gray-500">
                    Manage admin users and permissions
                  </p>
                </div>

                <div className="p-4 rounded-md hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-medium text-gray-900">
                    Application Settings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure global app settings
                  </p>
                </div>

                <div className="p-4 rounded-md hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-medium text-gray-900">Security</h3>
                  <p className="text-sm text-gray-500">
                    Manage security settings
                  </p>
                </div>

                <div className="p-4 rounded-md hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Configure notification settings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
