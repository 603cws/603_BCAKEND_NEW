import mongoose, { Document, Schema, Types } from 'mongoose';
// user: Types.ObjectId;
// Booking Schema
interface DayPassInterface extends Document {
  space: Types.ObjectId;
  user: Types.ObjectId;
  companyName: string;
  spaceName: string;
  bookeddate: string;
  email: string;
  day: number;
  month: number;
  year: number;
  phone: number;
  status:
    | 'pending'
    | 'COMPLETED'
    | 'FAILED'
    | 'REFUND'
    | 'confirmed'
    | 'cancelled';
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'pending' | 'credits';
  transactionId: string;
  transactionTIme: string;
  transactionAmount: number;
  createdAt?: Date;
}
// user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
const DayPassSchema: Schema<DayPassInterface> = new Schema({
  space: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  spaceName: { type: String, required: true },
  phone: { type: mongoose.Schema.Types.Mixed },
  bookeddate: { type: String, required: true },
  day: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  transactionId: { type: String },
  transactionTIme: { type: String },
  transactionAmount: { type: Number },
  status: {
    type: String,
    // enum: [
    //   'pending',
    //   'confirmed',
    //   'cancelled',
    //   'authorized',
    //   'captured',
    //   'success',
    //   'failed',
    // ],
    enum: [
      'COMPLETED',
      'FAILED',
      'REFUND',
      'pending',
      'confirmed',
      'cancelled',
    ],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    // enum: ["card", "paypal", "bank_transfer", "upi", "netbanking", "pending"],
    enum: ['credits', 'UPI', 'CARD', 'NETBANKING', 'pending'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

export const DayPass = mongoose.model<DayPassInterface>(
  'DayPass',
  DayPassSchema
);
