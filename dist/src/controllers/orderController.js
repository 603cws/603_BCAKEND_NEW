"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storePaymentTestingApi = exports.validateOrder = exports.createOrder = void 0;
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { validateWebhookSignature, } = require("razorpay/dist/utils/razorpay-utils");
const booking_model_1 = require("../models/booking.model");
const space_model_1 = require("../models/space.model");
const emailUtils_1 = require("../utils/emailUtils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Daypassbookingmodel_1 = require("../models/Daypassbookingmodel");
const payment_model_1 = require("../models/payment.model");
//configure
dotenv.config();
//razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_SECRETKEY,
});
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
const orderDataStore = {};
// Route to handle order creation
const createOrder = async (req, res) => {
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "error",
            error,
        });
    }
};
exports.createOrder = createOrder;
// Route to handle payment validation and fetch payment method
const validateOrder = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
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
        // Retrieve custom data from the in-memory store using razorpay_order_id
        const orderData = orderDataStore[razorpay_order_id];
        if (!orderData) {
            return res.status(404).json({ message: "Order not found in memory" });
        }
        //send a email
        const userEmail = orderData.customData.userDetails.email;
        // Read HTML template from file
        const templatePath = path_1.default.join(__dirname, "../utils/email.html");
        let htmlTemplate = fs_1.default.readFileSync(templatePath, "utf8");
        // Replace placeholders with actual values
        const companyName = orderData.customData.userDetails.companyName;
        if (orderData.customData.bookings.length !== 0) {
            //get space id
            const loc = await space_model_1.SpaceModel.findOne({
                name: orderData.customData.bookings.spaceName,
            });
            if (!loc) {
                return res.status(404).json({ message: "Location not found" });
            }
            const newBooking = new booking_model_1.BookingModel({
                user: orderData.customData.userDetails._id,
                space: loc?._id,
                companyName: orderData.customData.userDetails.companyName,
                spaceName: loc?.name,
                location: loc?.location,
                startTime: orderData.customData.bookings.startTime,
                endTime: orderData.customData.bookings.endTime,
                date: orderData.customData.bookings,
                // creditsspent: credits, //check for later
                paymentMethod,
                status: "confirmed",
            });
            const storeBooking = await newBooking.save();
            //store payment
            const newPayment = new payment_model_1.PaymentModel({
                user: orderData.customData.userDetails._id,
                booking: storeBooking._id,
                amount: payment.amount / 100,
                paymentMethod,
                status: paymentStatus,
            });
            await newPayment.save();
            const htmlContent = htmlTemplate
                .replace("{{name}}", companyName)
                .replace("{{startTime}}", orderData.customData.bookings.startTime)
                .replace("{{endTime}}", orderData.customData.bookings.endTime)
                .replace("{{place}}", loc.name)
                .replace("{{date}}", orderData.customData.bookings.date);
            // Send confirmation email
            await (0, emailUtils_1.sendEmailAdmin)(userEmail, "Booking Confirmation", "Your room booking at 603 Coworking Space has been successfully confirmed.", htmlContent);
        }
        if (orderData.customData.daypasses.length !== 0) {
            //get space id
            const loc = await space_model_1.SpaceModel.findOne({
                name: orderData.customData.dayPasses.spaceName,
            });
            const newDaypass = new Daypassbookingmodel_1.DayPass({
                space: loc?._id,
                companyName: orderData.customData.userDetails.companyName,
                user: orderData.customData.userDetails._id,
                email: orderData.customData.userDetails.email,
                spaceName: loc?.name,
                phone: orderData.customData.userDetails.phone,
                bookeddate: orderData.customData.daypasses.bookeddate,
                day: orderData.customData.daypasses.day,
                month: orderData.customData.daypasses.month,
                year: orderData.customData.daypasses.year,
                status: payment.status,
                paymentMethod,
            });
            const storeDaypass = await newDaypass.save();
            //store payment
            const newPayment = new payment_model_1.PaymentModel({
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error fetching payment method", error });
    }
};
exports.validateOrder = validateOrder;
const storePaymentTestingApi = async (req, res) => {
    const { bookings, userDetails, amount, paymentMethod, paymentStatus } = req.body;
    //store payment
    const newPayment = new payment_model_1.PaymentModel({
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
exports.storePaymentTestingApi = storePaymentTestingApi;
