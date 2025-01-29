// src/cron/cronHandler.ts
// import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';
import { VercelRequest, VercelResponse } from '@vercel/node';

const MONGODB_URI = process.env.DB_URL;

// Create a simple log schema
const CronLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: { type: String },
});

const CronLog = mongoose.model('CronLog', CronLogSchema);

async function logCronExecution(message: string) {
  await CronLog.create({ message });
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return; // Already connected
  await mongoose.connect(MONGODB_URI as string);
}

export async function cronHandler(req: VercelRequest, res: VercelResponse) {
  await connectToDatabase();
  console.log('cron connected');
  await logCronExecution('Cron job executed at: ' + new Date().toISOString());
  try {
    console.log('Cron job executed at:', new Date().toISOString());

    const result = await UserModel.updateMany({}, [
      { $set: { creditsleft: { $toDouble: '$monthlycredits' } } },
    ]);

    console.log(
      `Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents`
    );

    await logCronExecution(`Updated ${result.modifiedCount} users`);

    res.status(200).json({ message: 'Cron job executed successfully' });
  } catch (error) {
    console.error('Error executing cron job:', error);
    await logCronExecution('Error: ' + error);

    res.status(500).json({ message: 'Internal Server Error' });
  }
}
