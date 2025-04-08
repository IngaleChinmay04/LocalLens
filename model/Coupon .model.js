import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    appliesTo: {
      type: String,
      enum: [
        "all",
        "specific_shops",
        "specific_categories",
        "specific_products",
        "new_users",
        "loyal_users",
      ],
      default: "all",
    },
    specificShops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
    ],
    specificCategories: [String],
    specificProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    usageLimit: {
      perUser: {
        type: Number,
        default: 1,
      },
      total: Number,
    },
    totalUsage: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        discountAmount: Number,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFirstOrderOnly: {
      type: Boolean,
      default: false,
    },
    termsAndConditions: [String],
    displayOnStore: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for coupon lookups
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
CouponSchema.index({ appliesTo: 1 });
CouponSchema.index({ specificShops: 1 });
CouponSchema.index({ specificCategories: 1 });

// Method to validate if a coupon is applicable
CouponSchema.methods.isValidFor = async function (user, cart, shopId) {
  // Check if coupon is active and within valid dates
  const now = new Date();
  if (!this.isActive || now < this.validFrom || now > this.validUntil) {
    return { valid: false, reason: "Coupon is not active or has expired" };
  }

  // Check usage limits
  if (this.usageLimit.total && this.totalUsage >= this.usageLimit.total) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  // Check if user has already used this coupon
  const userUsage = this.usedBy.filter(
    (usage) => usage.userId.toString() === user._id.toString()
  ).length;

  if (userUsage >= this.usageLimit.perUser) {
    return { valid: false, reason: "You have already used this coupon" };
  }

  // Check if first order only
  if (this.isFirstOrderOnly) {
    const orderCount = await mongoose
      .model("Order")
      .countDocuments({ userId: user._id });
    if (orderCount > 0) {
      return {
        valid: false,
        reason: "This coupon is valid for first orders only",
      };
    }
  }

  // Check minimum order value
  if (this.minOrderValue > 0 && cart.subtotal < this.minOrderValue) {
    return {
      valid: false,
      reason: `Minimum order value of ₹${this.minOrderValue} required`,
    };
  }

  // Check specific shops constraint
  if (
    this.appliesTo === "specific_shops" &&
    this.specificShops.length > 0 &&
    !this.specificShops.some((shop) => shop.toString() === shopId.toString())
  ) {
    return { valid: false, reason: "Coupon not applicable for this shop" };
  }

  // Check specific categories constraint
  if (
    this.appliesTo === "specific_categories" &&
    this.specificCategories.length > 0
  ) {
    // Fetch products to check their categories
    const productIds = cart.items.map((item) => item.productId);
    const products = await mongoose
      .model("Product")
      .find({ _id: { $in: productIds } });

    const hasValidCategory = products.some((product) =>
      this.specificCategories.includes(product.category)
    );

    if (!hasValidCategory) {
      return {
        valid: false,
        reason: "Coupon not applicable for these product categories",
      };
    }
  }

  // Check specific products constraint
  if (
    this.appliesTo === "specific_products" &&
    this.specificProducts.length > 0
  ) {
    const productIds = cart.items.map((item) => item.productId.toString());
    const hasValidProduct = productIds.some((id) =>
      this.specificProducts.some((specificId) => specificId.toString() === id)
    );

    if (!hasValidProduct) {
      return {
        valid: false,
        reason: "Coupon not applicable for these products",
      };
    }
  }

  // Check if for new users only
  if (this.appliesTo === "new_users") {
    const userCreationDate = new Date(user.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (userCreationDate < thirtyDaysAgo) {
      return { valid: false, reason: "Coupon is for new users only" };
    }
  }

  // Check if for loyal users only
  if (this.appliesTo === "loyal_users") {
    const orderCount = await mongoose.model("Order").countDocuments({
      userId: user._id,
      createdAt: { $gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    });

    if (orderCount < 3) {
      // Assuming loyal = 3+ orders in last 90 days
      return { valid: false, reason: "Coupon is for loyal customers only" };
    }
  }

  return { valid: true };
};

// Calculate discount amount
CouponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = subtotal * (this.discountValue / 100);
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
  }

  // Apply max discount cap if set
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }

  return discount;
};

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);

export default Coupon;
