import express from "express";

import {
  createHomeSection,
  deleteHomeSection,
  getHomeSections,
  updateHomeSection
} from "../controller/homeSectionController.js";
import { adminOnly, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getHomeSections);
router.post("/", protectedRoute, adminOnly, createHomeSection);
router.put("/:id", protectedRoute, adminOnly, updateHomeSection);
router.delete("/:id", protectedRoute, adminOnly, deleteHomeSection);

export default router;
