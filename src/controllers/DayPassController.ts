import { Request, Response } from 'express';
import { DayPass } from '../models/Daypassbookingmodel';
import { Types } from 'mongoose';
import { SpaceModel } from '../models/space.model';
import { UserModel } from '../models/user.model';

interface DayPassBookingRequest extends Request {
  body: {
    space: Types.ObjectId;
    companyName: string;
    spaceName: string;
    bookeddate: string;
    day: number;
    month: number;
    year: number;
    phone: number;
    email: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentMethod: 'pending' | 'credit_card' | 'paypal';
  };
}

// user:Types.ObjectId
// date:string;

export const DayPassBooking = async (
  req: DayPassBookingRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      space,
      companyName,
      spaceName,
      bookeddate,
      month,
      year,
      status,
      day,
      paymentMethod,
      phone,
      email,
    } = req.body;

    const loc = await SpaceModel.findOne({ name: spaceName });
    if (!loc) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    const existingBooking = await DayPass.findOne({ space, bookeddate });

    if (existingBooking) {
      res
        .status(400)
        .json({ message: 'Booking already exists for this date and space.' });
      return;
    }

    const newBooking = new DayPass({
      space: loc._id,
      companyName,
      spaceName,
      bookeddate,
      day,
      month,
      year,
      status,
      paymentMethod,
      phone,
      email,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: 'DayPass Booking created successfully',
      booking: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

//create daypass database
export const createDaypass = async (req: Request, res: Response) => {
  try {
    const {
      accHolder,
      spaceName,
      bookeddate,
      month,
      year,
      status,
      day,
      paymentMethod,
    } = req.body;

    const loc = await SpaceModel.findOne({ name: spaceName });
    if (!loc) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    const user = await UserModel.findOne({ email: accHolder.email });
    if (!user) {
      res.status(404).json({ message: 'user not found' });
      return;
    }

    const transactionId = 'hduhriyiokeoufc';
    const transactionTIme = '12:00';
    const transactionAmount = 999;

    const newBooking = new DayPass({
      space: loc._id,
      user: user._id,
      companyName: user.companyName,
      spaceName,
      bookeddate,
      date: bookeddate,
      day,
      month,
      year,
      status,
      paymentMethod,
      phone: user.phone,
      email: user.email,
      transactionAmount,
      transactionId,
      transactionTIme,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      booking: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getdaypassbookings = async (req: Request, res: Response) => {
  try {
    const { selectedMonth, selectedYear, selectedLocation } = req.body;

    if (!selectedLocation) {
      return res.status(400).json({ message: 'selectedLocation is required' });
    }

    if (selectedMonth === undefined || selectedYear === undefined) {
      return res
        .status(400)
        .json({ message: 'selectedMonth and selectedYear are required' });
    }

    // Find the location based on the provided name
    const location = await SpaceModel.findOne({ name: selectedLocation });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Query to find all bookings for the specified month and year, projecting only the "day" field without "_id"
    const bookings = await DayPass.find(
      {
        space: location._id,
        month: selectedMonth,
        year: selectedYear,
      },
      { day: 1, _id: 0 } // Exclude "_id" field in the projection
    );

    // Extract the "day" values as an array of numbers
    const daysArray = bookings.map(booking => booking.day);

    res.status(200).json(daysArray);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

// {
//     "_id": {
//       "$oid": "673c4031b5c2547d36da6687"
//     },
//     "space": {
//       "$oid": "6724804d5c694d98e3e0048e"
//     },
//     "companyName": "603cws",
//     "email": "manchadiyuvraj@gmail.com",
//     "spaceName": "Bandra Day Pass",
//     "phone": "9594767165",
//     "bookeddate": "18/11/2024",
//     "day": 18,
//     "month": 11,
//     "year": 2024,
//     "status": "captured",
//     "paymentMethod": "upi",
//     "createdAt": {
//       "$date": "2024-11-19T07:37:21.615Z"
//     },
//     "__v": 0
//   }

//getdaypasses by user
export const getDaypassesOfUser = async (req: Request, res: Response) => {
  try {
    const { accHolder } = req.body;

    console.log(accHolder);

    const getAllDaypasses = await DayPass.find({ email: accHolder.email });
    if (!getAllDaypasses) {
      return res.status(400).json('Daypass not found');
    }
    res.status(200).json(getAllDaypasses);
  } catch (error) {
    res.status(400).json({ message: 'something went wrong' });
  }
};

//
