import { Request, Response, NextFunction } from "express";
import { BookingModel } from "../models/booking.model";

//convert time to 24hr basis
function timeTo24Hours(timeStr: string): string {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");

  if (modifier === "pm" && hours !== "12") {
    hours = (parseInt(hours, 10) + 12).toString();
  } else if (modifier === "am" && hours === "12") {
    hours = "00";
  }

  return `${hours}:${minutes}`;
}

//check time overlap function
function checkTimeOverlap(
  documents: any,
  inputStartTime: string,
  inputEndTime: string
) {
  // Convert input times to 24-hour format for comparison
  const inputStart = timeTo24Hours(inputStartTime);
  const inputEnd = timeTo24Hours(inputEndTime);

  for (let doc of documents) {
    // Convert document start and end times to 24-hour format
    const docStart = timeTo24Hours(doc.startTime);
    const docEnd = timeTo24Hours(doc.endTime);

    // Check for overlap
    if (
      inputStart < docEnd &&
      inputEnd > docStart // General time overlap condition
    ) {
      return true; // Overlap found
    }
  }

  return false; // No overlap found
}

export const isBookingOverlap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookings } = req.body;

    if (bookings.length === 0) {
      next();
    }
    //get all the booking for that date and location
    const bookingDetails = await BookingModel.find({
      date: bookings.date,
      spaceName: bookings.spaceName,
    });

    //check if there is any overlap
    const isoverlap = checkTimeOverlap(
      bookingDetails,
      bookings.startTime,
      bookings.endTime
    );

    if (isoverlap) {
      return res
        .status(400)
        .json({ msg: "booking already exisit in this time range" });
    } else {
      next();
    }
  } catch (error) {
    return res.status(400).json({
      msg: "booking exisit in this range",
      error: error instanceof Error ? error.message : "booking exist",
    });
  }
};
