import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_confirmation",
        "order_status_update",
        "reservation_confirmation",
        "reservation_reminder",
        "product_back_in_stock",
        "price_drop",
        "review_response",
        "promotion",
        "account_update",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: String,
    link: String,
    linkText: String,
    referenceId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to order, product, etc.
    },
    referenceModel: {
      type: String,
      enum: ["Order", "Product", "Reservation", "Shop", "Review", "User"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isActionRequired: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for notification queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

// Pre-save hook to set expiry date based on notification type if not set
NotificationSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    const now = new Date();

    // Set default expiry dates based on notification type
    switch (this.type) {
      case "promotion":
        // Promotions expire after 7 days
        now.setDate(now.getDate() + 7);
        break;
      case "product_back_in_stock":
        // Back in stock notifications expire after 3 days
        now.setDate(now.getDate() + 3);
        break;
      case "price_drop":
        // Price drop notifications expire after 5 days
        now.setDate(now.getDate() + 5);
        break;
      default:
        // All other notifications expire after 30 days
        now.setDate(now.getDate() + 30);
    }

    this.expiresAt = now;
  }
  next();
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
