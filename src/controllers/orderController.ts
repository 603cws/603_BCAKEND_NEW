import { Request, Response } from "express";
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

import { BookingModel } from "../models/booking.model";
import { createBooking } from "../controllers/bookingControllers";
import { SpaceModel } from "../models/space.model";
import { sendEmailAdmin } from "../utils/emailUtils";
import fs from "fs";
import path from "path";
import { DayPass } from "../models/Daypassbookingmodel";
import { PaymentModel } from "../models/payment.model";

//configure
dotenv.config();

//razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_SECRETKEY,
});

// In-memory store to hold the order data
const orderDataStore: Record<string, any> = {};

// Route to handle order creation
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { options, bookings, daypasses, userDetails } = req.body;
    console.log(req.body);

    const order = await razorpay.orders.create(options);
    console.log(order);

    // Store custom data in Redis using the `razorpay_order_id` as the key
    const customData = {
      bookings,
      daypasses,
      userDetails,
    };
    // Store custom data in-memory using the `razorpay_order_id` as the key
    orderDataStore[order.id] = {
      customData,
    };

    console.log(orderDataStore);

    if (!order) {
      return res.status(500).json({ message: "error" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "error",
      error,
    });
  }
};

// Route to handle payment validation and fetch payment method
export const validateOrder = async (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  // Verify the payment signature
  const sha = crypto.createHmac("sha256", "CNdNjoyuKTMCKtsojYtmrgvV");
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit" });
  }

  try {
    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (!payment) {
      return res.status(500).json({ msg: "Error fetching payment details" });
    }

    console.log(payment);

    // Extract the payment method used
    const paymentMethod = payment.method; // e.g., "card", "upi", "netbanking", etc.

    //payment status
    const paymentStatus = payment.status; //eg,'authorized','captured','failed'
    if (paymentStatus === "failed") {
      // Payment failed
      return res.status(400).json({
        msg: "Payment failed",
        status: paymentStatus, // Failed status
        error: payment.error_code ? payment.error_code : "Unknown error",
        description: payment.error_description
          ? payment.error_description
          : "No description available",
      });
    }

    // Retrieve custom data from the in-memory store using razorpay_order_id
    const orderData = orderDataStore[razorpay_order_id];

    if (!orderData) {
      return res.status(404).json({ message: "Order not found in memory" });
    }

    //send a email
    const userEmail = orderData.customData.userDetails.email;

    // Read HTML template from file
    const templatePath = path.join(__dirname, "../utils/email.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders with actual values
    const companyName = orderData.customData.userDetails.companyName;

    if (orderData.customData.bookings.length !== 0) {
      //get space id
      const loc = await SpaceModel.findOne({
        name: orderData.customData.bookings[0].spaceName,
      });
      if (!loc) {
        return res.status(404).json({ message: "Location not found" });
      }

      const newBooking = new BookingModel({
        user: orderData.customData.userDetails._id,
        space: loc?._id,
        companyName: orderData.customData.userDetails.companyName,
        spaceName: loc?.name,
        location: loc?.location,
        startTime: orderData.customData.bookings[0].startTime,
        endTime: orderData.customData.bookings[0].endTime,
        date: orderData.customData.bookings[0].date,
        // creditsspent: credits, //check for later
        paymentMethod,
        status: "confirmed",
      });
      const storeBooking = await newBooking.save();

      //store payment
      const newPayment = new PaymentModel({
        user: orderData.customData.userDetails._id,
        booking: storeBooking._id,
        amount: payment.amount / 100,
        paymentMethod,
        status: paymentStatus,
      });

      //store the payment
      await newPayment.save();

      const htmlContent = htmlTemplate
        .replace("{{name}}", companyName)
        .replace("{{startTime}}", orderData.customData.bookings[0].startTime)
        .replace("{{endTime}}", orderData.customData.bookings[0].endTime)
        .replace("{{place}}", loc.name)
        .replace("{{date}}", orderData.customData.bookings[0].date);

      // Send confirmation email

      await sendEmailAdmin(
        userEmail,
        "Booking Confirmation",
        "Your room booking at 603 Coworking Space has been successfully confirmed.",
        htmlContent
      );
    }

    if (orderData.customData.daypasses.length !== 0) {
      //get space id
      const loc = await SpaceModel.findOne({
        name: orderData.customData.dayPasses[0].spaceName,
      });

      const newDaypass = new DayPass({
        space: loc?._id,
        companyName: orderData.customData.userDetails.companyName,
        user: orderData.customData.userDetails._id,
        email: orderData.customData.userDetails.email,
        spaceName: loc?.name,
        phone: orderData.customData.userDetails.phone,
        bookeddate: orderData.customData.daypasses[0].bookeddate,
        day: orderData.customData.daypasses[0].day,
        month: orderData.customData.daypasses[0].month,
        year: orderData.customData.daypasses[0].year,
        status: payment.status,
        paymentMethod,
      });

      const storeDaypass = await newDaypass.save();

      //store payment
      const newPayment = new PaymentModel({
        user: orderData.customData.userDetails._id,
        booking: storeDaypass._id,
        amount: payment.amount / 100,
        paymentMethod,
        status: paymentStatus,
      });

      await newPayment.save();

      //send a mail to the daypass booking person
    }

    // Send response back with payment details
    res.status(200).json({
      msg: "Success",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentMethod, // Send the payment method in the response
      paymentDetails: payment, // Optional: Send complete payment details if needed
      customData: orderData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error fetching payment method", error });
  }
};

export const storePaymentTestingApi = async (req: Request, res: Response) => {
  const { bookings, userDetails, amount, paymentMethod, paymentStatus } =
    req.body;

  // //store payment
  const newPayment = new PaymentModel({
    user: userDetails._id,
    booking: bookings._id,
    amount: amount / 100,
    paymentMethod,
    status: paymentStatus,
  });
  await newPayment.save();

  res.status(200).json({
    message: "success",
    newPayment,
  });
};
