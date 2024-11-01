import { Router } from "express";
import { DayPassBooking, getdaypassbookings } from "../controllers/DayPassController";
const router = Router();


router.post("/bookdaypass", DayPassBooking);
router.post("/getdata", getdaypassbookings)

export default router;