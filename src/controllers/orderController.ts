import { Request, Response } from "express";
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

// import { createClient } from "redis";

//configure
dotenv.config();

//razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_SECRETKEY,
});

// // Create Redis client
// const redisClient = createClient();

// // Connect to Redis
// (async () => {
//   try {
//     await redisClient.connect(); // Ensure Redis client is connected
//     console.log("Connected to Redis...");
//   } catch (error) {
//     console.error("Error connecting to Redis:", error);
//   }
// })();

// payment schema
// const paymentSchema: Schema = new Schema<PaymentInterface>({
//   user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
//   amount: { type: Number, required: true },
//   paymentMethod: {
//     type: String,
//     enum: ["card", "paypal", "bank_transfer", "upi", "netbanking"],
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "completed", "failed", "authorized", "success"],
//     default: "pending",
//   },
//   createdAt: { type: Date, default: Date.now },
// });

// userdetails
// {
//   "user": {
//       "_id": "6729c2e70d51e5f265467a94",
//       "companyName": "603cws",
//       "username": "testuser",
//       "email": "manchadiyuvraj@gmail.com",
//       "country": "India",
//       "state": "Haryana",
//       "city": "Hisar",
//       "zipcode": "125005",
//       "password": "$2b$10$CBpB76XlqvftF5xWCWppG.5nl3OH7TabhLk4E5Pkz3XZQQiNhjTXO",
//       "phone": "9594767165",
//       "role": "admin",
//       "kyc": false,
//       "creditsleft": 1,
//       "monthlycredits": 7,
//       "extracredits": 22,
//       "createdAt": "2024-11-05T07:01:59.543Z",
//       "__v": 0
//   }
// }

//booking array

// date// : // "13/11/2024"
// endTime// : // "9:00 pm"
// price// : // 1199
// spaceName// : // "Bandra Conference Room"
// startTime// : // "8:00 pm"

//to create a order
// 1)get user data,booking data

//2)send a post req to createOrder along with user data ,booking data

//3)send a req to validate

//4)save the payment data to database

// In-memory store to hold the order data
const orderDataStore: Record<string, any> = {};

// Route to handle order creation
export const createOrder = async (req: Request, res: Response) => {
  try {
    console.log("enter the api");

    //using redis for data management
    // console.log(dayPasses, "daypasses");
    // console.log(bookings, "bookings");
    // console.log(data, "user details");

    console.log(req.body);
    // {price: 899, spaceName: 'Bandra Day Pass', bookeddate: '15/11/2024', day: 15, month: 10}

    const { options, bookings, daypasses, userDetails } = req.body;

    const order = await razorpay.orders.create(options);
    console.log(order);

    // const order = false;

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
    // // Store custom data in Redis with expiration time (EX in seconds)
    // await redisClient.set(order.id, JSON.stringify(customData), {
    //   EX: 3600, // 1 hour expiration
    // });

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
    // created: Payment request is created.
    // authorized: Payment is authorized but not captured.
    // captured: Payment was successful and captured.
    // failed: Payment failed.
    // refunded: Payment was refunded.
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

    // //get data back from the redis

    // // Fetch custom data from Redis using razorpay_order_id as the key
    // const data = await redisClient.get(razorpay_order_id);
    // if (!data) {
    //   return res.status(404).json({ message: "Order not found in Redis" });
    // }

    // // Parse the custom data from Redis
    // const customData = JSON.parse(data);

    // Retrieve custom data from the in-memory store using razorpay_order_id
    const orderData = orderDataStore[razorpay_order_id];

    if (!orderData) {
      return res.status(404).json({ message: "Order not found in memory" });
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
