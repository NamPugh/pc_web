import express from "express";

import { getSiteSetting, updateSiteSetting } from "../controller/siteSettingController.js";
import { adminOnly, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getSiteSetting);
router.put("/", protectedRoute, adminOnly, updateSiteSetting);

export default router;
