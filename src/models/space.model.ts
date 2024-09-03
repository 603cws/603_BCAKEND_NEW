import mongoose, { Document, Schema } from "mongoose";

// Space Schema
interface SpaceInterface extends Document {
    name: string;
    roomtype: "conference" | "meeting";
    location: string;
    description?: string;
    amenities?: string[];
    capacity: number;
    createdAt?: Date;
}

const spaceSchema: Schema = new Schema<SpaceInterface>({
    name: { type: String, required: true },
    roomtype: { type: String, enum: ["conference", "meeting"] },
    location: { type: String, required: true },
    description: { type: String },
    amenities: { type: [String] },
    capacity: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const SpaceModel = mongoose.model<SpaceInterface>('Space', spaceSchema);
