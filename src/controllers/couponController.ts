
import { Request, Response } from 'express';

import { Coupon } from './../models/coupon.model';

export const createCoupon = async (req: Request, res: Response) => {
  const { code, discount, expiryDate, usageLimit } = req.body;

  try {
    const newCoupon = new Coupon({ code, discount, expiryDate, usageLimit });

    const couponCreated = await newCoupon.save();

    res.status(200).json({
      message: 'success',
      couponCreated,
    });
  } catch (error) {
    res.status(400).json({
      message: 'something went wrong ,coupon not created',
    });
  }
};


//req body for creating a discount code
// {
//     "code": "DISCOUNT10",
//     "discount": 10,
//     "expiryDate": "2024-12-31T23:59:59Z",
//     "usageLimit": 100
//   }

export const validateCouponCode = async (req: Request, res: Response) => {
  const { code } = req.body;
  try {
    const getCoupon = await Coupon.findOne({ code: code });

    if (!getCoupon) {
      return res.status(400).json('invalid coupon code or coupon not found');
    }

    if (getCoupon.expiryDate < new Date()) {
        return res.status(400).json({ error: "Coupon expired" });
    }
    res.status(200).json(getCoupon);
  } catch (error) {
    res.status(400).json({
      message: 'something went wrong',
    });
  }
};
