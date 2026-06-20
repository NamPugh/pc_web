import express from "express";
import { vnPayIpn, vnPayReturn } from "../controller/paymentController.js";

const router = express.Router();

router.get("/vnpay/ipn", vnPayIpn);
router.get("/vnpay/return", vnPayReturn);

export default router;
