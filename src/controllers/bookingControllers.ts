import { Request, Response } from "express";
import { BookingModel } from "../models/booking.model";
import { sendEmailAdmin } from "../utils/emailUtils";
import { UserModel } from "../models/user.model";
import fs from 'fs';
import path from 'path';
import { SpaceModel } from "../models/space.model";
import jwt from "jsonwebtoken";


// Create a new booking
export const createBooking = async (req: Request, res: Response) => {
  const { startTime, endTime, email, location, date, companyName } = req.body.appointmentDetails;
  const { credits } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email ID is required" });
    }
    const userdet = await UserModel.findOne({ email: email });
    if (!userdet) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the location
    const loc = await SpaceModel.findOne({ name: location });
    if (!loc) {
      return res.status(404).json({ message: "Location not found" });
    }
    if(userdet.creditsleft>=credits){
    userdet.creditsleft -= credits;
    }else{
      const a = userdet.creditsleft;
      userdet.creditsleft = 0;
      userdet.extracredits += credits-a;
    }



    const newBooking = new BookingModel({
      user: userdet._id,
      space: loc._id,
      companyName,
      spaceName : location,
      location,
      startTime,
      endTime,
      date,
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
    const templatePath = path.join(__dirname, '../utils/email.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual values
    const a = userdet.companyName;
    const htmlContent = htmlTemplate
      .replace('{{name}}', a)
      .replace('{{startTime}}', startTime)
      .replace('{{endTime}}', endTime)
      .replace('{{place}}', location)
      .replace('{{date}}', date)

    // Send confirmation email
    await sendEmailAdmin(
      userEmail,
      "Booking Confirmation",
      "Your room booking at 603 Coworking Space has been successfully confirmed.",
      htmlContent
    );

    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking", error });
  }
};



//get only specified location bookings
export const getlocationbookings = async (req: Request, res: Response) => {
  try {
    const { selectedDate, selectedLocation } = req.body;

    if (!selectedLocation) {
      return res.status(400).json({ message: "selectedLocation is required" });
    }

    if (!selectedDate) {
      return res.status(400).json({ message: "selectedDate is required" });
    }

    const location = await SpaceModel.findOne({ name: selectedLocation });

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    const bookings = await BookingModel.find({ date: selectedDate, space: location._id });
    if (bookings.length != 0) {
      let arr: [string, string][] = bookings.map(a => [a.startTime, a.endTime]);

      const convertToTime = (time: string): Date => {
        const [hourMinute, period] = time.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);
        if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
        return new Date(0, 0, 0, hour, minute);
      };

      arr.sort((a, b) => convertToTime(a[0]).getTime() - convertToTime(b[0]).getTime());
      const merged: [string, string][] = [];
      let [currentStart, currentEnd] = arr[0];

      for (let i = 1; i < arr.length; i++) {
        let [nextStart, nextEnd] = arr[i];

        if (convertToTime(nextStart) <= convertToTime(currentEnd)) {
          currentEnd = convertToTime(nextEnd) > convertToTime(currentEnd) ? nextEnd : currentEnd;
        } else {
          merged.push([currentStart, currentEnd]);
          [currentStart, currentEnd] = [nextStart, nextEnd];
        }
      }

      merged.push([currentStart, currentEnd]);
      res.status(200).json(merged);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};






// Get all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await BookingModel.find().populate("user space");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

// Get booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  const bookingId = req.params.id;
  try {
    const booking = await BookingModel.findById(bookingId).populate("user space");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking", error });
  }
};

// Get bookings by user ID
export const getBookingsByUserId = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const bookings = await BookingModel.find({ user: userId }).populate("space");
    if (!bookings) {
      return res.status(404).json({ message: "Bookings not found" });
    }
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings by user ID", error });
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  try {
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: "Error updating booking status", error });
  }
};

// Delete a booking

export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.body; // Extract ID from req.body
  try {
    const deletedBooking = await BookingModel.findByIdAndDelete(id);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting booking", error });
  }
};



export const allbookingbyadmin = async (req: Request, res: Response) => {
  try {
    const allbookings = await BookingModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      msg: "bookingdetails",
      allbookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};