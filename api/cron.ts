// src/cron/cronHandler.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';

const MONGODB_URI = process.env.DB_URL;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return; // Already connected
  await mongoose.connect(MONGODB_URI as string);
}

export async function cronHandler(req: Request, res: Response) {
  await connectToDatabase();
  console.log("cron connected");
  try {
    console.log("Cron job executed at:", new Date().toISOString());

    const result = await UserModel.updateMany(
      {},
      [{ $set: { creditsleft: { $toDouble: "$monthlycredits" } } }]
    );

    console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents`);

    res.status(200).json({ message: 'Cron job executed successfully' });
  } catch (error) {
    console.error('Error executing cron job:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
