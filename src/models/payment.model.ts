import mongoose, { Document, Schema, Types } from "mongoose";

// Payment Schema
interface PaymentInterface extends Document {
  user: Types.ObjectId;
  booking: Types.ObjectId;
  amount: number;
  paymentMethod: "credit_card" | "paypal" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  createdAt?: Date;
}

const paymentSchema: Schema = new Schema<PaymentInterface>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["card", "paypal", "bank_transfer", "upi", "netbanking"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "authorized", "success"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const PaymentModel = mongoose.model<PaymentInterface>(
  "Payment",
  paymentSchema
);
