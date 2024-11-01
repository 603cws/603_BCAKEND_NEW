"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DayPassController_1 = require("../controllers/DayPassController");
const router = (0, express_1.Router)();
router.post("/bookdaypass", DayPassController_1.DayPassBooking);
router.post("/getdata", DayPassController_1.getdaypassbookings);
exports.default = router;
