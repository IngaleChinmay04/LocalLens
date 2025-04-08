import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productSnapshot: {
    name: {
      type: String,
      required: true,
    },
    description: String,
    images: [String],
    category: String,
    brand: String,
    sku: String,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
  },
  variantSnapshot: {
    name: String,
    attributes: {
      color: String,
      size: String,
      material: String,
      style: String,
    },
    images: [String],
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  shopSnapshot: {
    name: {
      type: String,
      required: true,
    },
    contactPhone: String,
    contactEmail: String,
    address: {
      addressLine1: String,
      city: String,
      state: String,
      postalCode: String,
    },
  },
  status: {
    type: String,
    enum: ["processing", "ready", "completed", "canceled", "refunded"],
    default: "processing",
  },
  statusUpdates: [
    {
      status: {
        type: String,
        enum: ["processing", "ready", "completed", "canceled", "refunded"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    },
  ],
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
  },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discounts: {
      couponDiscount: {
        type: Number,
        default: 0,
      },
      couponCode: String,
      shopDiscounts: [
        {
          shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
          },
          amount: Number,
          reason: String,
        },
      ],
    },
    taxes: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    billingAddressSameAsShipping: {
      type: Boolean,
      default: true,
    },
    billingAddress: {
      name: String,
      phoneNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "upi", "card"],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      method: String,
      status: String,
      paidAt: Date,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "ready_for_pickup",
        "completed",
        "canceled",
        "refunded",
      ],
      default: "pending",
    },
    statusUpdates: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "processing",
            "ready_for_pickup",
            "completed",
            "canceled",
            "refunded",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    cancelReason: String,
    notes: String,
    estimatedPickupTime: Date,
    actualPickupTime: Date,
    deliveryInstructions: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for order lookups and filtering
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "items.shopId": 1 });

// Pre-save hook to generate order number
OrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    // Generate a unique order number (e.g., LL-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr =
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const randomStr = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `LL-${dateStr}-${randomStr}`;
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;
