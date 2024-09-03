import mongoose, { Document, Schema, Types } from "mongoose";

// Booking Schema
interface BookingInterface extends Document {
  user: Types.ObjectId;
  space: Types.ObjectId;
  companyName : string;
  spaceName: string,
  startTime: string;
  endTime: string;
  date : string;
  status: "pending" | "confirmed" | "cancelled";
  paymentMethod: "pending" | "credits" | "credit_card" | "paypal";
  createdAt?: Date;
}

const bookingSchema: Schema = new Schema<BookingInterface>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  space: { type: Schema.Types.ObjectId, ref: "Space", required: true },
  companyName: { type: String, required: true },
  spaceName : { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  date : { type: String, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  paymentMethod: { type: String, enum: ["credits", "credit_card", "paypal", "pending"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export const BookingModel = mongoose.model<BookingInterface>("Booking", bookingSchema);
