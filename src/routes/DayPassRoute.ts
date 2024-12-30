import { Router } from 'express';
import {
  DayPassBooking,
  getdaypassbookings,
  getDaypassesOfUser,
  createDaypass,
} from '../controllers/DayPassController';
const router = Router();

router.post('/bookdaypass', DayPassBooking);
router.post('/getdata', getdaypassbookings);
router.post('/getalldaypassbyuser', getDaypassesOfUser);
router.post('/createDaypass', createDaypass);

export default router;
