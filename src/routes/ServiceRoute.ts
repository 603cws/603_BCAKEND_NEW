import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { admin } from "../middlewares/adminMiddleware";
import {
  createSpace,
  getAllSpaces,
  getSpaceById,
  updateSpace,
  deleteSpace
} from "../controllers/SpaceController";

const router = Router();

router.post("/", protect, admin, createSpace);
router.get("/", getAllSpaces);
router.get("/:id", getSpaceById);
router.put("/:id", protect, admin, updateSpace);
router.delete("/:id", protect, admin, deleteSpace);

export default router;
