import { Router } from "express";
import { createCoupon, validateCouponCode } from "../controllers/couponController";

const router = Router()

router.post("/createcoupon",createCoupon)
router.get("/getcoupon",validateCouponCode)


export default router