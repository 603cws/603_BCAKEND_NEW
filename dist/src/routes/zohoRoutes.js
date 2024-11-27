"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zohoController_1 = require("../controllers/zohoController");
const router = (0, express_1.Router)();
router.get("/fetchLayout", zohoController_1.getlayouts);
exports.default = router;
