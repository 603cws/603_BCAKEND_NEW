import { Router } from "express";
import { getlayouts } from "../controllers/zohoController";
const router = Router();

router.get("/fetchLayout", getlayouts);

export default router;
