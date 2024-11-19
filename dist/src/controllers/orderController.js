"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createdaypassesPaymentDatabase = exports.createBookingPaymentDatabase = exports.validateOrder = exports.createOrder = void 0;
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
// Route to handle order creation
const createOrder = async (req, res) => {
    try {
        const { options } = req.body;
        console.log(req.body);
        const order = await razorpay.orders.create(options);
        console.log(order);
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
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRETKEY);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");
    if (digest !== razorpay_signature) {
        return res.status(400).json({ msg: "Transaction is not legit" });
    }
    try {
        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (!payment) {
            return res
                .status(500)
                .json({ msg: "Error fetching payment details", payment });
        }
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
        // Send response back with payment details
        res.status(200).json({
            msg: "Success",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentMethod, // Send the payment method in the response
            paymentDetails: payment, // Optional: Send complete payment details if needed
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ msg: "error ", error });
    }
};
exports.validateOrder = validateOrder;
// export const storePaymentTestingApi = async (req: Request, res: Response) => {
//   const { bookings, userDetails, amount, paymentMethod, paymentStatus } =
//     req.body;
//   // //store payment
//   const newPayment = new PaymentModel({
//     user: userDetails._id,
//     booking: bookings._id,
//     amount: amount / 100,
//     paymentMethod,
//     status: paymentStatus,
//   });
//   await newPayment.save();
//   res.status(200).json({
//     message: "success",
//     newPayment,
//   });
// };
// //function to store booking and payment and send email to the user
// export const createBookingPaymentDatabase = async (
//   req: Request,
//   res: Response
// ) => {
//   const { bookings, userDetails, paymentMethod, paymentDetails, paymentId } =
//     req.body;
//   console.log(req.body);
//   try {
//     // Find the location
//     const loc = await SpaceModel.findOne({ name: bookings[0].spaceName });
//     if (!loc) {
//       return res.status(404).json({ message: "Location not found" });
//     }
//     const newBooking = new BookingModel({
//       user: userDetails._id,
//       space: loc?._id,
//       companyName: userDetails.companyName,
//       spaceName: loc?.name,
//       location: loc?.location,
//       startTime: bookings[0].startTime,
//       endTime: bookings[0].endTime,
//       date: bookings[0].date,
//       paymentMethod,
//       status: paymentDetails.status,
//     });
//     const storeBooking = await newBooking.save();
//     console.log(storeBooking);
//     //store payment
//     const newPayment = new PaymentModel({
//       user: userDetails._id,
//       booking: storeBooking._id,
//       amount: paymentDetails.amount / 100,
//       paymentMethod,
//       status: paymentDetails.status,
//       paymentId,
//     });
//     //store the payment
//     const storepayment = await newPayment.save();
//     console.log(storepayment);
//     const userEmail = userDetails.email;
//     // Read HTML template from file
//     const templatePath = path.join(__dirname, "../utils/email.html");
//     let htmlTemplate = fs.readFileSync(templatePath, "utf8");
//     // Replace placeholders with actual values
//     const a = userDetails.companyName;
//     const htmlContent = htmlTemplate
//       .replace("{{name}}", a)
//       .replace("{{startTime}}", bookings[0].startTime)
//       .replace("{{endTime}}", bookings[0].endTime)
//       .replace("{{place}}", loc?.name)
//       .replace("{{date}}", bookings[0].date);
//     // Send confirmation email
//     await sendEmailAdmin(
//       userEmail,
//       "Booking Confirmation",
//       "Your room booking at 603 Coworking Space has been successfully confirmed.",
//       htmlContent
//     );
//     res.status(201).json(newBooking);
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({ message: "Error creating booking", error });
//   }
// };
// //function to store daypass, payment and send email to the user
// export const createdaypassesPaymentDatabase = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { daypasses, paymentDetails, paymentMethod, userDetails, paymentId } =
//       req.body;
//     //get space id
//     console.log(req.body);
//     const loc = await SpaceModel.findOne({
//       name: daypasses[0].spaceName,
//     });
//     console.log(loc);
//     const newDaypass = new DayPass({
//       space: loc?._id,
//       companyName: userDetails.companyName,
//       user: userDetails._id,
//       email: userDetails.email,
//       spaceName: loc?.name,
//       phone: userDetails.phone,
//       bookeddate: daypasses[0].bookeddate,
//       day: daypasses[0].day,
//       month: daypasses[0].month,
//       year: daypasses[0].year,
//       status: paymentDetails.status,
//       paymentMethod,
//     });
//     const storeDaypass = await newDaypass.save();
//     console.log(storeDaypass);
//     //store payment
//     const newPayment = new PaymentModel({
//       user: userDetails._id,
//       daypasses: storeDaypass._id,
//       amount: paymentDetails.amount / 100,
//       paymentMethod,
//       status: paymentDetails.status,
//       paymentId,
//     });
//     await newPayment.save();
//     const userEmail = userDetails.email;
//     // Read HTML template from file
//     const templatePath = path.join(__dirname, "../utils/daypassEmail.html");
//     console.log(templatePath);
//     let htmlTemplate = fs.readFileSync(templatePath, "utf8");
//     // Replace placeholders with actual values
//     const a = userDetails.companyName;
//     const htmlContent = htmlTemplate
//       .replace("{{name}}", a)
//       .replace("{{place}}", daypasses[0].spaceName)
//       .replace("{{date}}", daypasses[0].bookeddate);
//     await sendEmailAdmin(
//       userEmail,
//       "Booking Confirmation",
//       "Your dayPass booking at 603 Coworking Space has been successfully confirmed.",
//       htmlContent
//     );
//     res.status(201).json(newDaypass);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({
//       message: "something went wrong creating daypasses &storing ",
//       error,
//     });
//   }
// };
//function to store multiple  booking and payment and send email to the user
const createBookingPaymentDatabase = async (req, res) => {
    const { bookings, userDetails, paymentMethod, paymentDetails, paymentId } = req.body;
    console.log(req.body);
    //kayb hqev clbb euvv   for application
    //get the lenght of the array
    const TotalBookings = bookings.length + 1;
    // Assuming you want to map through the bookings and process each one
    const processBookings = async (bookings) => {
        try {
            // Use Promise.all to wait for all async operations to complete
            const bookingResults = await Promise.all(bookings.map(async (booking) => {
                // Find the location
                const loc = await space_model_1.SpaceModel.findOne({ name: booking.spaceName });
                if (!loc) {
                    throw new Error("Location not found");
                }
                const newBooking = new booking_model_1.BookingModel({
                    user: userDetails._id,
                    space: loc._id,
                    companyName: userDetails.companyName,
                    spaceName: loc.name,
                    location: loc.location,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    date: booking.date,
                    paymentMethod,
                    status: paymentDetails.status,
                });
                const storeBooking = await newBooking.save();
                console.log(storeBooking);
                let amountPerBooking = booking.price + booking.price * 0.18;
                // Store payment
                const newPayment = new payment_model_1.PaymentModel({
                    user: userDetails._id,
                    booking: storeBooking._id,
                    // amount: paymentDetails.amount / (TotalBookings * 100),
                    amount: amountPerBooking,
                    status: paymentDetails.status,
                    paymentMethod,
                    paymentId,
                });
                const storePayment = await newPayment.save();
                console.log(storePayment);
                const userEmail = userDetails.email;
                // Read HTML template from file
                const templatePath = path_1.default.join(__dirname, "../utils/email.html");
                let htmlTemplate = fs_1.default.readFileSync(templatePath, "utf8");
                // Replace placeholders with actual values
                const htmlContent = htmlTemplate
                    .replace("{{name}}", userDetails.companyName)
                    .replace("{{startTime}}", booking.startTime)
                    .replace("{{endTime}}", booking.endTime)
                    .replace("{{place}}", loc.name)
                    .replace("{{date}}", booking.date);
                // Send confirmation email
                await (0, emailUtils_1.sendEmailAdmin)(userEmail, "Booking Confirmation", "Your room booking at 603 Coworking Space has been successfully confirmed.", htmlContent);
                return storeBooking;
            }));
            // After all bookings are processed, send a response
            res.status(201).json(bookingResults);
        }
        catch (error) {
            console.log(error);
            res.status(404).json({
                message: "something went wrong creating booking &storing ",
                error,
            });
        }
    };
    processBookings(bookings);
};
exports.createBookingPaymentDatabase = createBookingPaymentDatabase;
//mutiple booking for daypasses
const createdaypassesPaymentDatabase = async (req, res) => {
    const { daypasses, paymentDetails, paymentMethod, userDetails, paymentId } = req.body;
    //get space id
    console.log(req.body);
    // Assuming you want to map through the bookings and process each one
    const processDaypasses = async (daypasses) => {
        try {
            // Use Promise.all to wait for all async operations to complete
            const dayPassResults = await Promise.all(daypasses.map(async (daypass) => {
                // Find the location
                const loc = await space_model_1.SpaceModel.findOne({ name: daypass.spaceName });
                if (!loc) {
                    throw new Error("Location not found");
                }
                const newDaypass = new Daypassbookingmodel_1.DayPass({
                    space: loc?._id,
                    companyName: userDetails.companyName,
                    user: userDetails._id,
                    email: userDetails.email,
                    spaceName: loc?.name,
                    phone: userDetails.phone,
                    bookeddate: daypass.bookeddate,
                    day: daypass.day,
                    month: daypass.month,
                    year: daypass.year,
                    status: paymentDetails.status,
                    paymentMethod,
                });
                const storeDaypass = await newDaypass.save();
                console.log(storeDaypass);
                let amountPerdaypas = daypass.price + daypass.price * 0.18;
                // Store payment
                const newPayment = new payment_model_1.PaymentModel({
                    user: userDetails._id,
                    daypasses: storeDaypass._id,
                    // amount: paymentDetails.amount / (Totaldaypass * 100),
                    amount: amountPerdaypas,
                    status: paymentDetails.status,
                    paymentMethod,
                    paymentId,
                });
                const storePayment = await newPayment.save();
                console.log(storePayment);
                const userEmail = userDetails.email;
                // Read HTML template from file
                const templatePath = path_1.default.join(__dirname, "../utils/daypassEmail.html");
                console.log(templatePath);
                let htmlTemplate = fs_1.default.readFileSync(templatePath, "utf8");
                // Replace placeholders with actual values
                const a = userDetails.companyName;
                const htmlContent = htmlTemplate
                    .replace("{{name}}", a)
                    .replace("{{place}}", daypass.spaceName)
                    .replace("{{date}}", daypass.bookeddate);
                await (0, emailUtils_1.sendEmailAdmin)(userEmail, "Booking Confirmation", "Your dayPass booking at 603 Coworking Space has been successfully confirmed.", htmlContent);
                return storeDaypass;
            }));
            // After all daypass are processed, send a response
            res.status(201).json(dayPassResults);
        }
        catch (error) {
            console.log(error);
            res.status(404).json({
                message: "something went wrong creating daypasses &storing ",
                error,
            });
        }
    };
    processDaypasses(daypasses);
};
exports.createdaypassesPaymentDatabase = createdaypassesPaymentDatabase;
