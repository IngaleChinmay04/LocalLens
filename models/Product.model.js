import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
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
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    brand: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["g", "kg", "oz", "lb"],
        default: "g",
      },
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ["cm", "in", "m"],
        default: "cm",
      },
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxOrderQuantity: {
      type: Number,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isPreBookable: {
      type: Boolean,
      default: false,
    },
    preBookConfig: {
      leadTime: {
        type: Number, // in hours
      },
      maxPreBookQuantity: {
        type: Number,
      },
      preBookFee: {
        type: Number,
        default: 0,
      },
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
    totalSales: {
      type: Number,
      default: 0,
    },
    attributes: {
      type: Map,
      of: String,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variantAttributes: [
      {
        type: String,
        enum: ["color", "size", "material", "style", "other"],
      },
    ],
    searchTerms: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate calculated fields
ProductSchema.virtual("sellingPrice").get(function () {
  if (this.discountPercentage > 0) {
    return this.basePrice * (1 - this.discountPercentage / 100);
  }
  return this.basePrice;
});

// Pre-save hook to create slug automatically
ProductSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = `${this.name}-${Date.now()}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }

  // Generate search terms
  this.searchTerms = [
    this.name.toLowerCase(),
    this.category.toLowerCase(),
    this.subcategory ? this.subcategory.toLowerCase() : "",
    this.brand ? this.brand.toLowerCase() : "",
    ...this.tags.map((tag) => tag.toLowerCase()),
  ].filter(Boolean);

  next();
});

// Create indexes for efficient searching
ProductSchema.index({ name: "text", description: "text", searchTerms: "text" });
ProductSchema.index({ isAvailable: 1 });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ createdAt: -1 });

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
