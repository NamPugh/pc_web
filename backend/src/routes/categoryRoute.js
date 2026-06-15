import express from 'express';
import { createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
 } from '../controller/categoryController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", protectedRoute, adminOnly, createCategory);
router.put("/:id", protectedRoute, adminOnly, updateCategory);
router.delete("/:id", protectedRoute, adminOnly, deleteCategory);

export default router;