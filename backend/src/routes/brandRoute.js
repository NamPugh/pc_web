import express from 'express';
import { createBrand,
        getBrandById,
        getBrands,
        updateBrand,
        deleteBrand
 } from '../controller/brandController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", getBrands);
router.get("/:id", getBrandById);
router.post("/",protectedRoute, adminOnly, createBrand);
router.put("/:id", protectedRoute, adminOnly, updateBrand);
router.delete("/:id", protectedRoute, adminOnly, deleteBrand);

export default router;

