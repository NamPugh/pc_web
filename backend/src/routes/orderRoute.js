import express from 'express';
import { createOrder,
         getMyOrders,
         getAllOrders,
         getOrderStats,
         updateOrderStatus,
         cancelOrder,
         getOrderById
 } from '../controller/orderController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/", protectedRoute, createOrder);
router.get("/my-orders", protectedRoute, getMyOrders);
router.get("/stats", protectedRoute, adminOnly, getOrderStats);
router.get("/", protectedRoute, adminOnly, getAllOrders);
router.get("/:id", protectedRoute, getOrderById);
router.put("/:id/status", protectedRoute, adminOnly, updateOrderStatus);
router.put("/:id/cancel", protectedRoute, cancelOrder);

export default router;
