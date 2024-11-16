"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
//
const router = (0, express_1.Router)();
router.post("/createorder", orderController_1.createOrder);
router.post("/validateOrder", orderController_1.validateOrder);
router.post("/testPaymentatore", orderController_1.storePaymentTestingApi);
exports.default = router;
