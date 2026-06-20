import Order from "../models/Order.js";
import { verifyVnPayResponse } from "../utils/vnpay.js";

const getPaymentResult = async (query, updateOrder) => {
  if (!verifyVnPayResponse(query)) {
    return { valid: false, code: "97", message: "Chữ ký VNPay không hợp lệ" };
  }

  const order = await Order.findById(query.vnp_TxnRef);
  if (!order || order.paymentMethod !== "vnpay") {
    return { valid: true, code: "01", message: "Không tìm thấy đơn hàng" };
  }

  if (Number(query.vnp_Amount) !== Math.round(order.totalPrice * 100)) {
    return { valid: true, code: "04", message: "Số tiền thanh toán không hợp lệ", order };
  }

  const successful = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";
  if (updateOrder && successful && order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.paymentDetails = {
      transactionNo: String(query.vnp_TransactionNo || ""),
      bankCode: String(query.vnp_BankCode || ""),
      responseCode: String(query.vnp_ResponseCode || ""),
      payDate: String(query.vnp_PayDate || ""),
      paidAt: new Date()
    };
    await order.save();
  }

  return {
    valid: true,
    code: successful ? "00" : String(query.vnp_ResponseCode || "99"),
    message: successful ? "Thanh toán thành công" : "Thanh toán chưa thành công",
    order
  };
};

export const vnPayIpn = async (req, res) => {
  try {
    const result = await getPaymentResult(req.query, true);
    if (!result.valid) return res.status(200).json({ RspCode: "97", Message: "Invalid Checksum" });
    if (!result.order) return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    if (result.code === "04") return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    return res.status(200).json({ RspCode: "99", Message: error.message });
  }
};

export const vnPayReturn = async (req, res) => {
  try {
    const result = await getPaymentResult(req.query, true);
    return res.json({
      success: result.valid && result.code === "00",
      code: result.code,
      message: result.message,
      data: result.order || null
    });
  } catch (error) {
    return res.status(400).json({ success: false, code: "99", message: "Không thể xác minh giao dịch", error: error.message });
  }
};
