import { NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/dbConnect";

export async function POST(req) {
  try {
    await dbConnect();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await req.json();

    // Validate the request
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return NextResponse.json(
        { error: "All payment verification details are required" },
        { status: 400 }
      );
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Update order with payment details
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: "processing", // Update status from pending to processing
        "paymentDetails.status": "completed",
        "paymentDetails.razorpayPaymentId": razorpay_payment_id,
        "paymentDetails.razorpaySignature": razorpay_signature,
        "paymentDetails.paidAt": new Date(),
        statusUpdates: {
          $push: {
            status: "processing",
            timestamp: new Date(),
            notes: "Payment completed successfully",
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
