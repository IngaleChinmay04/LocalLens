"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "react-hot-toast";
import { uploadToCloudinaryViaAPI } from "@/lib/cloudinaryClient";

export default function ShopRegistrationForm() {
  const router = useRouter();
  const { mongoUser, user, getIdToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    categories: [],
    registrationNumber: "",
    gstin: "",
    logo: null,
    verificationDocument: null,
    latitude: "",
    longitude: "",
  });

  // Pre-fill email when user data is available
  useEffect(() => {
    if (mongoUser?.email) {
      setFormData((prev) => ({
        ...prev,
        contactEmail: mongoUser.email,
      }));
    }
  }, [mongoUser]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "categories") {
      setFormData({
        ...formData,
        categories: value.split(",").map((item) => item.trim()),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle file inputs
  // Add this validation to your handleFileChange function
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];

      // Check file size - 10MB limit in bytes
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File too large. Maximum size is 10MB. Your file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB.`
        );
        // Reset the file input
        e.target.value = "";
        return;
      }

      setFormData({
        ...formData,
        [name]: file,
      });
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Detecting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          toast.success("Location detected successfully");
        },
        (error) => {
          toast.dismiss();
          toast.error("Unable to retrieve your location");
          console.error(error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Form validation for the final step
    if (!formData.gstin) {
      toast.error("GSTIN is required");
      return;
    }

    if (!formData.verificationDocument) {
      toast.error("Verification document is required");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Submitting shop registration...");

    try {
      const formDataToSend = new FormData();

      // Append all text data
      Object.keys(formData).forEach((key) => {
        if (
          key !== "logo" &&
          key !== "verificationDocument" &&
          key !== "categories"
        ) {
          formDataToSend.append(key, formData[key]);
        }
      });

      let logoUrl = "";
      let verificationDocUrl = "";

      if (formData.logo) {
        const uniqueId = `${formData.name
          .replace(/\s+/g, "-")
          .toLowerCase()}-${Date.now()}`;
        const result = await uploadToCloudinaryViaAPI(
          formData.logo,
          "locallens/shop-logos",
          uniqueId,
          getIdToken // Pass your getIdToken function from useAuth
        );
        logoUrl = result.secure_url;
      }

      if (formData.verificationDocument) {
        const uniqueId = `verification-${formData.gstin.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}-${Date.now()}`;
        const result = await uploadToCloudinaryViaAPI(
          formData.verificationDocument,
          "locallens/verification-docs",
          uniqueId,
          getIdToken
        );
        verificationDocUrl = result.secure_url;
      }

      // Append Cloudinary URLs
      formDataToSend.append("logoUrl", logoUrl);
      formDataToSend.append("verificationDocumentUrl", verificationDocUrl);

      // Append arrays correctly
      formData.categories.forEach((category) => {
        formDataToSend.append("categories[]", category);
      });

      // Set the location data
      formDataToSend.append("location[type]", "Point");
      formDataToSend.append("location[coordinates][0]", formData.longitude); // Longitude first in GeoJSON
      formDataToSend.append("location[coordinates][1]", formData.latitude);

      // Add user information
      if (mongoUser?._id) {
        formDataToSend.append("userId", mongoUser._id);
      }

      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      toast.dismiss(toastId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register shop");
      }

      const result = await response.json();
      console.log("Shop registration successful:", result);

      toast.success("Shop registration submitted successfully!");
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push("/retailer/shops");
      }, 1500);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error.message || "An error occurred during shop registration"
      );
      console.error("Shop registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of your component remains the same
  // ...

  const renderFormStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Shop Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">
                    Contact Email*
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Contact Phone*
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Categories*</label>
                <input
                  type="text"
                  name="categories"
                  value={formData.categories.join(", ")}
                  onChange={handleChange}
                  placeholder="Enter categories separated by commas"
                  required
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  E.g., Clothing, Electronics, Food, etc.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Shop Logo</label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </>
        );

      // Other form steps remain the same
      // ...

      case 2:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Location & Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  Address Line 1*
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">City*</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">State*</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">
                    Postal Code*
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Country*</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Latitude*</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Longitude*</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Get Current Location
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  This will auto-fill latitude and longitude fields.
                </p>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Business Verification
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your business registration number, if applicable.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">GSTIN*</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your GST Identification Number.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Upload Verification Document*
                </label>
                <input
                  type="file"
                  name="verificationDocument"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a document that verifies your business (e.g., GSTIN
                  certificate, business license).
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-700 mb-2">
                  By submitting this form, you agree to LocalLens&apos;s terms
                  and conditions for retailers.
                </p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Your shop registration will be reviewed by our team.
                    You&apos;ll be notified once your shop is approved.
                  </p>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Register Your Shop</h1>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {stepNumber}
              </div>
              <div className="text-xs mt-1">
                {stepNumber === 1
                  ? "Basic Info"
                  : stepNumber === 2
                  ? "Location"
                  : "Verification"}
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded">
            <div
              className="h-1 bg-emerald-600 rounded"
              style={{
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {renderFormStep()}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Previous
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 ml-auto ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading
              ? "Submitting..."
              : step < 3
              ? "Next"
              : "Submit Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
