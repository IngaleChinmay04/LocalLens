"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function BannerManagement() {
  const { getIdToken } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    backgroundColor: "from-emerald-600 to-teal-500",
    isActive: true,
    order: 0,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      const response = await fetch("/api/admin/banners", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch banners");
      }

      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct upload to Cloudinary for admin users
  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    setIsUploading(true);

    try {
      // Create FormData for direct Cloudinary upload
      const data = new FormData();
      data.append("file", imageFile);
      data.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "locallens_unsigned"
      );
      data.append("folder", "banners");

      // Upload directly to Cloudinary using unsigned upload
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      console.log("Uploading image to Cloudinary directly...");
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${errorText}`);
      }

      const imageData = await response.json();
      setIsUploading(false);

      console.log("Image uploaded successfully:", imageData.secure_url);
      return imageData.secure_url;
    } catch (error) {
      setIsUploading(false);
      console.error("Error uploading image:", error);
      toast.error("Image upload failed: " + error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await getIdToken();
      let imageUrl = formData.image;

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const bannerData = {
        ...formData,
        image: imageUrl,
      };

      const url = currentBanner
        ? `/api/admin/banners/${currentBanner._id}`
        : "/api/admin/banners";

      const method = currentBanner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${currentBanner ? "update" : "create"} banner`
        );
      }

      toast.success(
        `Banner ${currentBanner ? "updated" : "created"} successfully`
      );
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error(error.message);
    }
  };

  const handleEditBanner = (banner) => {
    setCurrentBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      link: banner.link,
      backgroundColor: banner.backgroundColor || "from-emerald-600 to-teal-500",
      isActive: banner.isActive,
      order: banner.order || 0,
    });
    setImagePreview(banner.image);
    setIsModalOpen(true);
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete banner");
      }

      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error(error.message);
    }
  };

  const toggleBannerStatus = async (banner) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/banners/${banner._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update banner status");
      }

      toast.success(
        `Banner ${banner.isActive ? "disabled" : "enabled"} successfully`
      );
      fetchBanners();
    } catch (error) {
      console.error("Error toggling banner status:", error);
      toast.error(error.message);
    }
  };

  const changeBannerOrder = async (bannerId, direction) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/banners/${bannerId}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder banner");
      }

      fetchBanners();
    } catch (error) {
      console.error("Error reordering banner:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setCurrentBanner(null);
    setFormData({
      title: "",
      description: "",
      image: "",
      link: "",
      backgroundColor: "from-emerald-600 to-teal-500",
      isActive: true,
      order: 0,
    });
    setImagePreview("");
    setImageFile(null);
  };

  const handleAddNewBanner = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const backgroundOptions = [
    "from-emerald-600 to-teal-500",
    "from-blue-600 to-indigo-500",
    "from-purple-600 to-pink-500",
    "from-amber-500 to-orange-600",
    "from-red-600 to-pink-600",
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Promotional Banners</h2>
        <button
          onClick={handleAddNewBanner}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No banners found.</p>
          <button
            onClick={handleAddNewBanner}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Create Your First Banner
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title / Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-24 relative bg-gray-100 rounded overflow-hidden">
                        {banner.image && (
                          <Image
                            src={banner.image}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {banner.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {banner.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {banner.link}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          banner.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banner.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleBannerStatus(banner)}
                          className="text-gray-500 hover:text-gray-700"
                          title={
                            banner.isActive ? "Disable banner" : "Enable banner"
                          }
                        >
                          {banner.isActive ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => changeBannerOrder(banner._id, "up")}
                          className="text-gray-500 hover:text-gray-700"
                          title="Move up"
                        >
                          <ArrowUp className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => changeBannerOrder(banner._id, "down")}
                          className="text-gray-500 hover:text-gray-700"
                          title="Move down"
                        >
                          <ArrowDown className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit banner"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete banner"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banner Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {currentBanner ? "Edit Banner" : "Add New Banner"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link
                    </label>
                    <input
                      type="text"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <select
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                    >
                      {backgroundOptions.map((color) => (
                        <option key={color} value={color}>
                          {color.split("-")[1]} to {color.split("-")[3]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Active
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Image
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      {!imageFile && formData.image && (
                        <div className="mt-2 text-sm text-gray-500">
                          Current: {formData.image.substring(0, 40)}...
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="h-32 w-64 relative bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        Uploading...
                      </>
                    ) : currentBanner ? (
                      "Update Banner"
                    ) : (
                      "Create Banner"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
