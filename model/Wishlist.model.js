import mongoose from "mongoose";

const WishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
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

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Default Wishlist",
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    shareableLink: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for user and product to ensure uniqueness within a wishlist
WishlistSchema.index({ userId: 1, "items.productId": 1 });

// Generate shareable link when a wishlist is first created and not private
WishlistSchema.pre("save", function (next) {
  if (!this.isPrivate && !this.shareableLink) {
    this.shareableLink = `wl-${this._id}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;
  }
  next();
});

const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);

export default Wishlist;
