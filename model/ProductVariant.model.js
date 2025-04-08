import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      index: true,
    },
    attributes: {
      color: String,
      size: String,
      material: String,
      style: String,
      other: String,
    },
    priceModifier: {
      type: Number,
      default: 0, // Amount to add or subtract from base product price
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
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a compound index for product variants
ProductVariantSchema.index({
  productId: 1,
  "attributes.color": 1,
  "attributes.size": 1,
});

const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model("ProductVariant", ProductVariantSchema);

export default ProductVariant;
