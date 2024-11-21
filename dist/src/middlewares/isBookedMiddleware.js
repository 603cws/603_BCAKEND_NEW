"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBookingOverlap = void 0;
const booking_model_1 = require("../models/booking.model");
//convert time to 24hr basis
function timeTo24Hours(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (modifier === "pm" && hours !== "12") {
        hours = (parseInt(hours, 10) + 12).toString();
    }
    else if (modifier === "am" && hours === "12") {
        hours = "00";
    }
    return `${hours}:${minutes}`;
}
//check time overlap function
function checkTimeOverlap(documents, inputStartTime, inputEndTime) {
    // Convert input times to 24-hour format for comparison
    const inputStart = timeTo24Hours(inputStartTime);
    const inputEnd = timeTo24Hours(inputEndTime);
    for (let doc of documents) {
        // Convert document start and end times to 24-hour format
        const docStart = timeTo24Hours(doc.startTime);
        const docEnd = timeTo24Hours(doc.endTime);
        // Check for overlap
        if (inputStart < docEnd &&
            inputEnd > docStart // General time overlap condition
        ) {
            return true; // Overlap found
        }
    }
    return false; // No overlap found
}
// export const isBookingOverlap = async (req: Request, res: Response) => {
//   const { bookings } = req.body;
//   console.log(bookings);
//   //get all the booking for that date and location
//   const processBookings = async (bookings: any) => {
//     const bookingResults = await Promise.all(
//       bookings.map(async (booking: any) => {
//         const bookingDetails = await BookingModel.find({
//           date: booking.date,
//           spaceName: booking.spaceName,
//         });
//         console.log(bookingDetails);
//         //check if there is any overlap
//         const isoverlap = checkTimeOverlap(
//           bookingDetails,
//           booking.startTime,
//           booking.endTime
//         );
//         console.log(isoverlap);
//         if (isoverlap) {
//           return res
//             .status(400)
//             .json({ msg: "booking already exisit in this time range" });
//         }
//         if (!isoverlap) {
//           return res
//             .status(200)
//             .json({ msg: "no booking for this time range" });
//         }
//       })
//     );
//   };
//   processBookings(bookings);
// };
const isBookingOverlap = async (req, res) => {
    const { bookings } = req.body;
    // Validate `bookings` is an array
    // if (!Array.isArray(bookings) || bookings.length === 0) {
    //   return res.status(400).json({ msg: "Invalid or missing bookings data." });
    // }
    if (bookings.length === 0) {
        return res.status(200).json({ msg: "no bookings" });
    }
    try {
        // Process bookings
        for (const booking of bookings) {
            // Fetch bookings matching the same date and location
            const bookingDetails = await booking_model_1.BookingModel.find({
                date: booking.date,
                spaceName: booking.spaceName,
            });
            // Log for debugging
            console.log("Existing bookings:", bookingDetails);
            // Check for time overlap
            const isOverlap = checkTimeOverlap(bookingDetails, booking.startTime, booking.endTime);
            console.log("Overlap check:", isOverlap);
            //true overlap found ,false overlap not found
            // Return if there's an overlap
            if (isOverlap) {
                return res
                    .status(400)
                    .json({ msg: "Booking already exists in this time range." });
            }
        }
        // If no overlaps found
        return res
            .status(200)
            .json({ msg: "No booking overlaps for this time range." });
    }
    catch (error) {
        console.error("Error in isBookingOverlap:", error);
        return res.status(500).json({ msg: "Internal server error.", error });
    }
};
exports.isBookingOverlap = isBookingOverlap;
