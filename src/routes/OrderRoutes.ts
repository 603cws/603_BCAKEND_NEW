import { Router } from "express";
import {
  createBookingPaymentDatabase,
  createdaypassesPaymentDatabase,
  createOrder,
  storePaymentTestingApi,
  validateOrder,
} from "../controllers/orderController";
import { isBookingOverlap } from "../middlewares/isBookedMiddleware";
//
const router = Router();

router.post("/createorder", createOrder);
router.post("/validateOrder", validateOrder);
router.post("/storebooking", createBookingPaymentDatabase);
router.post("/storeDaypasses", createdaypassesPaymentDatabase);

//testing route
router.post("/testPaymentatore", storePaymentTestingApi);

export default router;
