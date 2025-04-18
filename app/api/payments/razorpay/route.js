import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/dbConnect";

export async function POST(req) {
  try {
    await dbConnect();
    const { amount, orderId, currency = "INR" } = await req.json();

    // Validate the request
    if (!amount || !orderId) {
      return NextResponse.json(
        { error: "Amount and orderId are required" },
        { status: 400 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount), // Amount in smallest currency unit (paise for INR)
      currency,
      receipt: orderId,
      payment_capture: 1, // Auto-capture
    });

    // Update the order with the Razorpay order ID
    await Order.findByIdAndUpdate(orderId, {
      "paymentDetails.razorpayOrderId": razorpayOrder.id,
      "paymentDetails.status": "pending",
    });

    return NextResponse.json(razorpayOrder);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
