import mongoose, { Document, Schema, Types } from "mongoose";

// Booking Schema
interface DayPassInterface extends Document {
  space: Types.ObjectId;
  companyName: string;
  spaceName: string;
  bookeddate: string;
  email: string;
  day: number;
  month: number;
  year: number;
  phone: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentMethod: "pending" | "credit_card" | "paypal";
  createdAt?: Date;
}

const DayPassSchema: Schema<DayPassInterface> = new Schema({
  space: { type: Schema.Types.ObjectId, ref: "Space", required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  spaceName: { type: String, required: true },
  phone: { type: mongoose.Schema.Types.Mixed },
  bookeddate: { type: String, required: true },
  day: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "cancelled",
      "authorized",
      "captured",
      "success",
      "failed",
    ],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["card", "paypal", "bank_transfer", "upi", "netbanking", "pending"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const DayPass = mongoose.model<DayPassInterface>(
  "DayPass",
  DayPassSchema
);
