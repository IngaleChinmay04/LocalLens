import mongoose from "mongoose";

const BusinessHoursSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    monday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        default: "09:00",
      },
      closeTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        default: "18:00",
      },
      breakStart: {
        type: String, // Format: "HH:MM" in 24-hour format
      },
      breakEnd: {
        type: String, // Format: "HH:MM" in 24-hour format
      },
    },
    tuesday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    wednesday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    thursday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    friday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    saturday: {
      isOpen: {
        type: Boolean,
        default: true,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    sunday: {
      isOpen: {
        type: Boolean,
        default: false,
      },
      openTime: {
        type: String,
        default: "09:00",
      },
      closeTime: {
        type: String,
        default: "18:00",
      },
      breakStart: String,
      breakEnd: String,
    },
    specialHolidays: [
      {
        date: {
          type: Date,
          required: true,
        },
        isOpen: {
          type: Boolean,
          default: false,
        },
        openTime: String,
        closeTime: String,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const BusinessHours =
  mongoose.models.BusinessHours ||
  mongoose.model("BusinessHours", BusinessHoursSchema);

export default BusinessHours;
