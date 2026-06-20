import express from "express";
import { cancelPendingVnPay, vnPayIpn, vnPayReturn } from "../controller/paymentController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/vnpay/ipn", vnPayIpn);
router.get("/vnpay/return", vnPayReturn);
router.post("/vnpay/cancel/:orderId", protectedRoute, cancelPendingVnPay);

export default router;
