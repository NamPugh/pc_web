import express from 'express';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';
import {
    getProducts,
    createProduct,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
} from "../controller/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);
router.post("/", protectedRoute, adminOnly, createProduct);
router.put("/:id", protectedRoute, adminOnly, updateProduct);
router.delete("/:id", protectedRoute, adminOnly, deleteProduct);

export default router;