import mongoose from "mongoose";

const ReservationItemSchema = new mongoose.Schema({
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
    images: [String],
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
});

const ReservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
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
    reservationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [ReservationItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    reservationFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    pickupTimeSlot: {
      start: {
        type: String, // HH:MM format
        required: true,
      },
      end: {
        type: String, // HH:MM format
        required: true,
      },
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "ready",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },
    statusUpdates: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "ready",
            "completed",
            "cancelled",
            "expired",
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
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    paymentDetails: {
      transactionId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      method: String,
      status: String,
      paidAt: Date,
    },
    contactInfo: {
      name: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    notes: String,
    cancelReason: String,
    convertedToOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for reservation lookups and filtering
ReservationSchema.index({ userId: 1, createdAt: -1 });
ReservationSchema.index({ shopId: 1, status: 1 });
ReservationSchema.index({ pickupDate: 1, status: 1 });
ReservationSchema.index({ status: 1, expiryDate: 1 });

// Pre-save hook to generate reservation number
ReservationSchema.pre("save", function (next) {
  if (!this.reservationNumber) {
    // Generate a unique reservation number (e.g., LLR-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr =
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const randomStr = Math.floor(10000 + Math.random() * 90000);
    this.reservationNumber = `LLR-${dateStr}-${randomStr}`;
  }
  next();
});

// Pre-save hook to set expiry date if not provided
ReservationSchema.pre("save", function (next) {
  if (!this.expiryDate) {
    // Default expiry is pickup date + 1 day
    const expiryDate = new Date(this.pickupDate);
    expiryDate.setDate(expiryDate.getDate() + 1);
    this.expiryDate = expiryDate;
  }
  next();
});

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", ReservationSchema);

export default Reservation;
