import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Reservation from "@/models/Reservation.model";
import Shop from "@/models/Shop.model";
import mongoose from "mongoose";
import { withFirebaseAuth } from "@/middleware/firebase-auth";

export async function PUT(request, { params }) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      await dbConnect();

      const { reservationId } = params;

      // Validate reservationId
      if (!mongoose.Types.ObjectId.isValid(reservationId)) {
        return NextResponse.json(
          { error: "Invalid reservation ID" },
          { status: 400 }
        );
      }

      // Get the user ID from Firebase auth middleware
      const userId = user._id;

      // Find the reservation
      const reservation = await Reservation.findById(reservationId);

      if (!reservation) {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 }
        );
      }

      // Check if the shop belongs to the user
      const shop = await Shop.findOne({
        _id: reservation.shopId,
        ownerId: userId,
      });

      if (!shop) {
        return NextResponse.json(
          { error: "You don't have permission to update this reservation" },
          { status: 403 }
        );
      }

      // Get status data from the request
      const { status } = await request.json();

      if (!status) {
        return NextResponse.json(
          { error: "Status is required" },
          { status: 400 }
        );
      }

      // Validate status
      const validStatuses = [
        "pending",
        "confirmed",
        "ready",
        "completed",
        "cancelled",
        "expired",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      // Update the reservation status
      const updatedReservation = await Reservation.findByIdAndUpdate(
        reservationId,
        {
          $set: { status },
          $push: {
            statusUpdates: {
              status,
              timestamp: new Date(),
              updatedBy: userId,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json(updatedReservation);
    } catch (error) {
      console.error("Error updating reservation status:", error);
      return NextResponse.json(
        { error: "Failed to update reservation status" },
        { status: 500 }
      );
    }
  });
}
