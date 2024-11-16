"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const isBookedMiddleware_1 = require("../middlewares/isBookedMiddleware");
//
const router = (0, express_1.Router)();
router.post("/createorder", isBookedMiddleware_1.isBookingOverlap, orderController_1.createOrder);
router.post("/validateOrder", orderController_1.validateOrder);
router.post("/testPaymentatore", orderController_1.storePaymentTestingApi);
exports.default = router;
