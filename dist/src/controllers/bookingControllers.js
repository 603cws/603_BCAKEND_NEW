"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allbookingbyadmin = exports.deleteBookingbyuser = exports.deleteBookingbyadmin = exports.updateBookingStatus = exports.getBookingsByUserId = exports.getBookingById = exports.getAllBookingsbyuser = exports.getlocationbookings = exports.createBooking = void 0;
const booking_model_1 = require("../models/booking.model");
const emailUtils_1 = require("../utils/emailUtils");
const user_model_1 = require("../models/user.model");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const space_model_1 = require("../models/space.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
// Create a new booking
const createBooking = async (req, res) => {
    const { startTime, endTime, email, location, date, companyName } = req.body.appointmentDetails;
    const { credits } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email ID is required" });
        }
        const userdet = await user_model_1.UserModel.findOne({ email: email });
        if (!userdet) {
            return res.status(404).json({ message: "User not found" });
        }
        // Find the location
        const loc = await space_model_1.SpaceModel.findOne({ name: location });
        if (!loc) {
            return res.status(404).json({ message: "Location not found" });
        }
        if (userdet.creditsleft >= credits) {
            userdet.creditsleft -= credits;
        }
        else {
            const a = userdet.creditsleft;
            userdet.creditsleft = 0;
            userdet.extracredits += credits - a;
        }
        const newBooking = new booking_model_1.BookingModel({
            user: userdet._id,
            space: loc._id,
            companyName,
            spaceName: location,
            location,
            startTime,
            endTime,
            date,
            creditsspent: credits,
            paymentMethod: "credits",
            status: "confirmed",
        });
        await userdet.save();
        await newBooking.save();
        if (!userdet || !userdet.email) {
            throw new Error("User email is not defined");
        }
        const userEmail = userdet.email;
        // Read HTML template from file
        const templatePath = path_1.default.join(__dirname, '../utils/email.html');
        let htmlTemplate = fs_1.default.readFileSync(templatePath, 'utf8');
        // Replace placeholders with actual values
        const a = userdet.companyName;
        const htmlContent = htmlTemplate
            .replace('{{name}}', a)
            .replace('{{startTime}}', startTime)
            .replace('{{endTime}}', endTime)
            .replace('{{place}}', location)
            .replace('{{date}}', date);
        // Send confirmation email
        await (0, emailUtils_1.sendEmailAdmin)(userEmail, "Booking Confirmation", "Your room booking at 603 Coworking Space has been successfully confirmed.", htmlContent);
        res.status(201).json(newBooking);
    }
    catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking", error });
    }
};
exports.createBooking = createBooking;
//get only specified location bookings
const getlocationbookings = async (req, res) => {
    try {
        const { selectedDate, selectedLocation } = req.body;
        if (!selectedLocation) {
            return res.status(400).json({ message: "selectedLocation is required" });
        }
        if (!selectedDate) {
            return res.status(400).json({ message: "selectedDate is required" });
        }
        const location = await space_model_1.SpaceModel.findOne({ name: selectedLocation });
        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }
        const bookings = await booking_model_1.BookingModel.find({ date: selectedDate, space: location._id });
        if (bookings.length != 0) {
            let arr = bookings.map(a => [a.startTime, a.endTime]);
            const convertToTime = (time) => {
                const [hourMinute, period] = time.split(' ');
                let [hour, minute] = hourMinute.split(':').map(Number);
                if (period.toLowerCase() === 'pm' && hour !== 12)
                    hour += 12;
                if (period.toLowerCase() === 'am' && hour === 12)
                    hour = 0;
                return new Date(0, 0, 0, hour, minute);
            };
            arr.sort((a, b) => convertToTime(a[0]).getTime() - convertToTime(b[0]).getTime());
            const merged = [];
            let [currentStart, currentEnd] = arr[0];
            for (let i = 1; i < arr.length; i++) {
                let [nextStart, nextEnd] = arr[i];
                if (convertToTime(nextStart) <= convertToTime(currentEnd)) {
                    currentEnd = convertToTime(nextEnd) > convertToTime(currentEnd) ? nextEnd : currentEnd;
                }
                else {
                    merged.push([currentStart, currentEnd]);
                    [currentStart, currentEnd] = [nextStart, nextEnd];
                }
            }
            merged.push([currentStart, currentEnd]);
            res.status(200).json(merged);
        }
        else {
            res.status(200).json([]);
        }
    }
    catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};
exports.getlocationbookings = getlocationbookings;
// Get all bookings
const getAllBookingsbyuser = async (req, res) => {
    try {
        const secretKey = process.env.SECRETKEY;
        if (!secretKey) {
            console.error("JWT secret key is not defined");
            return res.status(500).json({ msg: "JWT secret key is not defined" });
        }
        const cookies = cookie_1.default.parse(req.headers.cookie || '');
        console.log("jsdodckj   ", req.headers);
        const token = cookies.token;
        console.log(token);
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        const bookings = await booking_model_1.BookingModel.find({ user: decoded.id });
        res.status(200).json(bookings);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};
exports.getAllBookingsbyuser = getAllBookingsbyuser;
const getBookingById = async (req, res) => {
    const bookingId = req.params.id;
    try {
        const booking = await booking_model_1.BookingModel.findById(bookingId).populate("user space");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        res.status(200).json(booking);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching booking", error });
    }
};
exports.getBookingById = getBookingById;
// Get bookings by user ID
const getBookingsByUserId = async (req, res) => {
    const userId = req.params.id;
    try {
        const bookings = await booking_model_1.BookingModel.find({ user: userId }).populate("space");
        if (!bookings) {
            return res.status(404).json({ message: "Bookings not found" });
        }
        res.status(200).json(bookings);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching bookings by user ID", error });
    }
};
exports.getBookingsByUserId = getBookingsByUserId;
// Update booking status
const updateBookingStatus = async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    try {
        const updatedBooking = await booking_model_1.BookingModel.findByIdAndUpdate(bookingId, { status }, { new: true, runValidators: true });
        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating booking status", error });
    }
};
exports.updateBookingStatus = updateBookingStatus;
// Delete a booking
const deleteBookingbyadmin = async (req, res) => {
    const { id } = req.body; // Extract ID from req.body
    try {
        const deletedBooking = await booking_model_1.BookingModel.findByIdAndDelete(id);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        res.status(200).json({ message: "Booking deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting booking", error });
    }
};
exports.deleteBookingbyadmin = deleteBookingbyadmin;
const deleteBookingbyuser = async (req, res) => {
    const { bookingid, isCancellable, isRefundable } = req.body;
    try {
        const deletedBooking = await booking_model_1.BookingModel.findByIdAndDelete(bookingid);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (isCancellable) {
            const user = await user_model_1.UserModel.findById(deletedBooking.user);
            if (!user) {
                return res.status(404).json({ message: "user not found" });
            }
            if (isRefundable) {
                let a = user?.creditsleft;
                a += deletedBooking.creditsspent;
                if (user.monthlycredits <= a) {
                    user.creditsleft = user.monthlycredits;
                }
                else {
                    user.creditsleft = a;
                }
            }
            await user.save();
        }
        res.status(200).json({ message: "Booking cancelled successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting booking", error });
    }
};
exports.deleteBookingbyuser = deleteBookingbyuser;
const allbookingbyadmin = async (req, res) => {
    try {
        const allbookings = await booking_model_1.BookingModel.find().sort({ createdAt: -1 });
        return res.status(200).json({
            msg: "bookingdetails",
            allbookings
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
};
exports.allbookingbyadmin = allbookingbyadmin;
