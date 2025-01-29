"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronHandler = cronHandler;
// src/cron/cronHandler.ts
// import { Request, Response } from 'express';
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../src/models/user.model");
const MONGODB_URI = process.env.DB_URL;
// Create a simple log schema
const CronLogSchema = new mongoose_1.default.Schema({
    timestamp: { type: Date, default: Date.now },
    message: { type: String },
});
const CronLog = mongoose_1.default.model('CronLog', CronLogSchema);
async function logCronExecution(message) {
    await CronLog.create({ message });
}
async function connectToDatabase() {
    if (mongoose_1.default.connection.readyState === 1)
        return; // Already connected
    await mongoose_1.default.connect(MONGODB_URI);
}
async function cronHandler(req, res) {
    await connectToDatabase();
    console.log('cron connected');
    await logCronExecution('Cron job executed at: ' + new Date().toISOString());
    try {
        console.log('Cron job executed at:', new Date().toISOString());
        const result = await user_model_1.UserModel.updateMany({}, [
            { $set: { creditsleft: { $toDouble: '$monthlycredits' } } },
        ]);
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents`);
        await logCronExecution(`Updated ${result.modifiedCount} users`);
        res.status(200).json({ message: 'Cron job executed successfully' });
    }
    catch (error) {
        console.error('Error executing cron job:', error);
        await logCronExecution('Error: ' + error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
