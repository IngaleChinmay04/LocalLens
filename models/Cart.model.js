import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [CartItemSchema],
    couponCode: {
      type: String,
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shopDiscounts: [
      {
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shop",
        },
        discount: {
          type: Number,
          min: 0,
        },
        reason: String,
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    savedForLater: [CartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields for cart calculations
CartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

CartSchema.virtual("totalDiscount").get(function () {
  const shopDiscountsSum = this.shopDiscounts.reduce(
    (sum, discount) => sum + discount.discount,
    0
  );
  return this.couponDiscount + shopDiscountsSum;
});

CartSchema.virtual("total").get(function () {
  return Math.max(0, this.subtotal - this.totalDiscount);
});

CartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Methods for cart manipulation
CartSchema.methods.addItem = function (item) {
  const existingItemIndex = this.items.findIndex(
    (i) =>
      i.productId.toString() === item.productId.toString() &&
      ((!i.variantId && !item.variantId) ||
        (i.variantId &&
          item.variantId &&
          i.variantId.toString() === item.variantId.toString()))
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += item.quantity;
  } else {
    this.items.push(item);
  }

  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.removeItem = function (itemId) {
  this.items = this.items.filter(
    (item) => item._id.toString() !== itemId.toString()
  );
  this.lastUpdated = new Date();
  return this.save();
};

CartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const itemIndex = this.items.findIndex(
    (item) => item._id.toString() === itemId.toString()
  );
  if (itemIndex > -1) {
    this.items[itemIndex].quantity = quantity;
    this.lastUpdated = new Date();
  }
  return this.save();
};

CartSchema.methods.clearCart = function () {
  this.items = [];
  this.couponCode = null;
  this.couponDiscount = 0;
  this.shopDiscounts = [];
  this.lastUpdated = new Date();
  return this.save();
};

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

export default Cart;
