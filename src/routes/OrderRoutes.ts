import { Router } from "express";
import { createOrder, validateOrder } from "../controllers/orderController";
//
const router = Router();

router.post("/createorder", createOrder);
router.post("/validateOrder", validateOrder);

export default router;
