"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function ManualShopVerify() {
  const [shopId, setShopId] = useState("");
  const [status, setStatus] = useState("verified");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopId.trim()) {
      toast.error("Shop ID is required");
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/manual-shop-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shopId, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify shop");
      }

      setResult(data);
      toast.success(
        `Shop ${status === "verified" ? "approved" : "rejected"} successfully`
      );
    } catch (error) {
      toast.error(error.message);
      console.error("Error verifying shop:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-medium mb-4">Manual Shop Verification</h2>
      <p className="text-sm text-gray-500 mb-4">
        Use this form to manually verify a shop if the regular verification
        process isn't working.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop ID*
          </label>
          <input
            type="text"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. 67f5960442451a009f3ff6ec"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="verified">Approve (verify)</option>
            <option value="rejected">Reject</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Processing..." : "Update Shop Status"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Result:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
