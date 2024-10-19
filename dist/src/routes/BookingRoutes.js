"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const bookingControllers_1 = require("../controllers/bookingControllers");
const router = (0, express_1.Router)();
router.post("/getlocationbookings", bookingControllers_1.getlocationbookings);
router.get("/admin/getallbookings", adminMiddleware_1.admin, bookingControllers_1.allbookingbyadmin);
router.post("/", authMiddleware_1.protect, bookingControllers_1.createBooking);
router.get("/getallbookingsbyuser", authMiddleware_1.protect, bookingControllers_1.getAllBookingsbyuser);
router.get("/:id", authMiddleware_1.protect, bookingControllers_1.getBookingById);
router.get("/user/:id", authMiddleware_1.protect, bookingControllers_1.getBookingsByUserId);
router.put("/:id", authMiddleware_1.protect, bookingControllers_1.updateBookingStatus);
router.post("/admin/deletebooking", adminMiddleware_1.admin, bookingControllers_1.deleteBookingbyadmin);
router.post("/cancelbooking", authMiddleware_1.protect, bookingControllers_1.deleteBookingbyuser);
exports.default = router;
