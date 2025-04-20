import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Banner description is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Banner image URL is required"],
    },
    link: {
      type: String,
      required: [true, "Banner link is required"],
      trim: true,
    },
    backgroundColor: {
      type: String,
      default: "from-emerald-600 to-teal-500",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
