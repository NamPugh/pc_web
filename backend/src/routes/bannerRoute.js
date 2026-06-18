import express from 'express';
import { createBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    uploadBanner
 } from '../controller/bannerController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';
import { uploadBannerImage } from '../middlewares/bannerUploadMiddleware.js';

const router = express.Router();

router.get("/", getBanners);
router.post("/upload", protectedRoute, adminOnly, uploadBannerImage.single("image"), uploadBanner);
router.post("/", protectedRoute, adminOnly, createBanner);
router.put("/:id", protectedRoute, adminOnly, updateBanner);
router.delete("/:id", protectedRoute, adminOnly, deleteBanner);

export default router;
