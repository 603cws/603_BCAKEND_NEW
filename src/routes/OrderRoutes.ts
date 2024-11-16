import { Router } from "express";
import {
  createOrder,
  storePaymentTestingApi,
  validateOrder,
} from "../controllers/orderController";
import { isBookingOverlap } from "../middlewares/isBookedMiddleware";
//
const router = Router();

router.post("/createorder", createOrder);
router.post("/validateOrder", validateOrder);

router.post("/testPaymentatore", storePaymentTestingApi);

export default router;
