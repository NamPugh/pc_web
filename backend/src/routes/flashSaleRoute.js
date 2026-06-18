import express from "express";

import {
  addFlashSaleItem,
  createFlashSale,
  deleteFlashSale,
  deleteFlashSaleItem,
  getActiveFlashSale,
  getFlashSales,
  updateFlashSale,
  updateFlashSaleItem
} from "../controller/flashSaleController.js";
import { adminOnly, protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/active", getActiveFlashSale);
router.get("/", protectedRoute, adminOnly, getFlashSales);
router.post("/", protectedRoute, adminOnly, createFlashSale);
router.put("/:id", protectedRoute, adminOnly, updateFlashSale);
router.delete("/:id", protectedRoute, adminOnly, deleteFlashSale);
router.post("/:id/items", protectedRoute, adminOnly, addFlashSaleItem);
router.put("/:id/items/:itemId", protectedRoute, adminOnly, updateFlashSaleItem);
router.delete("/:id/items/:itemId", protectedRoute, adminOnly, deleteFlashSaleItem);

export default router;
