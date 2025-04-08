import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userDisplayName: {
      type: String,
      required: true,
    },
    userPhotoURL: String,
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: String,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    usersWhoFoundHelpful: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isVisible: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    rejectionReason: String,
    adminResponse: {
      content: String,
      respondedAt: Date,
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    ownerResponse: {
      content: String,
      respondedAt: Date,
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure that the review is about either a product or a shop, but not both
ReviewSchema.pre("validate", function (next) {
  if ((this.productId && this.shopId) || (!this.productId && !this.shopId)) {
    next(
      new Error(
        "A review must be about either a product or a shop, but not both or neither"
      )
    );
  } else {
    next();
  }
});

// Indexes for efficient review lookups
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ shopId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
