import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String, // URL to the logo image in Cloudinary
      default: null,
    },
    coverImages: [
      {
        url: String,
        caption: String,
      },
    ],
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    address: {
      addressLine1: {
        type: String,
        required: true,
        trim: true,
      },
      addressLine2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationDate: {
      type: Date,
    },
    // Add explicit verification document field
    verificationDocument: {
      type: String, // URL to the verification document in Cloudinary
      default: null,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    avgRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentMethods: [
      {
        type: String,
        enum: ["cash", "upi", "card", "netbanking"],
      },
    ],
    minOrderValue: {
      type: Number,
      default: 0,
    },
    deliveryRadius: {
      type: Number, // in km
      default: 5,
    },
    featuredProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    socialMedia: {
      instagram: String,
      facebook: String,
      twitter: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
ShopSchema.index({ location: "2dsphere" });
ShopSchema.index({ categories: 1 });
ShopSchema.index({ isVerified: 1, isActive: 1 });
ShopSchema.index({ name: "text", description: "text" });

const Shop = mongoose.models.Shop || mongoose.model("Shop", ShopSchema);

export default Shop;
