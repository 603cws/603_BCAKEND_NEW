"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponCode = exports.createCoupon = void 0;
const coupon_model_1 = require("./../models/coupon.model");
const createCoupon = async (req, res) => {
    const { code, discount, expiryDate, usageLimit } = req.body;
    try {
        const newCoupon = new coupon_model_1.Coupon({ code, discount, expiryDate, usageLimit });
        const couponCreated = await newCoupon.save();
        res.status(200).json({
            message: 'success',
            couponCreated,
        });
    }
    catch (error) {
        res.status(400).json({
            message: 'something went wrong ,coupon not created',
        });
    }
};
exports.createCoupon = createCoupon;
//req body for creating a discount code
// {
//     "code": "DISCOUNT10",
//     "discount": 10,
//     "expiryDate": "2024-12-31T23:59:59Z",
//     "usageLimit": 100
//   }
const validateCouponCode = async (req, res) => {
    const { code } = req.body;
    try {
        const getCoupon = await coupon_model_1.Coupon.findOne({ code: code });
        if (!getCoupon) {
            return res.status(400).json('invalid coupon code or coupon not found');
        }
        if (getCoupon.expiryDate < new Date()) {
            return res.status(400).json({ error: "Coupon expired" });
        }
        res.status(200).json(getCoupon);
    }
    catch (error) {
        res.status(400).json({
            message: 'something went wrong',
        });
    }
};
exports.validateCouponCode = validateCouponCode;
