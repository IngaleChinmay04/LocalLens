import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    photoURL: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      // index: true,
    },
    role: {
      type: String,
      enum: ["customer", "retailer", "admin"],
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    primaryAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    addressIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    defaultPaymentMethod: {
      type: String,
    },
    preferences: {
      notificationEnabled: {
        type: Boolean,
        default: true,
      },
      emailSubscribed: {
        type: Boolean,
        default: true,
      },
      preferredCategories: [String],
      maxDistance: {
        type: Number, // in km
        default: 10,
      },
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster user lookups
UserSchema.index({ phoneNumber: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
