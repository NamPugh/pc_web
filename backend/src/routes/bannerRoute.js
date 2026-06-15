import express from 'express';
import { createBanner,
    getBanners,
    updateBanner,
    deleteBanner
 } from '../controller/bannerController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", getBanners);
router.post("/", protectedRoute, adminOnly, createBanner);
router.put("/:id", protectedRoute, adminOnly, updateBanner);
router.delete("/:id", protectedRoute, adminOnly, deleteBanner);

export default router;