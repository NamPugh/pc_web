import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import FlashSale from "../models/FlashSale.js";
import { verifyVnPayResponse } from "../utils/vnpay.js";

const commitVnPayOrder = async (order) => {
  if (order.inventoryCommitted) return;

  const claimedOrder = await Order.findOneAndUpdate(
    { _id: order._id, inventoryCommitted: { $ne: true } },
    { $set: { inventoryCommitted: true } },
    { new: true }
  );
  if (!claimedOrder) return;

  const updatedItems = [];
  try {
    for (const item of claimedOrder.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw new Error(`${item.name} không còn đủ số lượng trong kho`);
      }
      updatedItems.push(item);

      if (item.flashSale && item.flashSaleItem) {
        await FlashSale.updateOne(
          { _id: item.flashSale, "items._id": item.flashSaleItem },
          { $inc: { "items.$.sold": item.quantity } }
        );
      }
    }

    const cart = await Cart.findOne({ user: claimedOrder.user });
    if (cart) {
      const orderedProductIds = new Set(claimedOrder.items.map((item) => item.product.toString()));
      cart.items = cart.items.filter((item) => !orderedProductIds.has(item.product.toString()));
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      await cart.save();
    }
  } catch (error) {
    for (const item of updatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity }
      });
      if (item.flashSale && item.flashSaleItem) {
        await FlashSale.updateOne(
          { _id: item.flashSale, "items._id": item.flashSaleItem },
          { $inc: { "items.$.sold": -item.quantity } }
        );
      }
    }
    await Order.findByIdAndUpdate(order._id, { inventoryCommitted: false });
    throw error;
  }
};

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
    await commitVnPayOrder(order);
    order.paymentStatus = "paid";
    order.paymentDetails = {
      transactionNo: String(query.vnp_TransactionNo || ""),
      bankCode: String(query.vnp_BankCode || ""),
      responseCode: String(query.vnp_ResponseCode || ""),
      payDate: String(query.vnp_PayDate || ""),
      paidAt: new Date()
    };
    await order.save();
  } else if (updateOrder && !successful && order.paymentStatus !== "paid") {
    order.orderStatus = "cancelled";
    order.paymentDetails.responseCode = String(query.vnp_ResponseCode || "");
    await order.save();
  }

  return {
    valid: true,
    code: successful ? "00" : String(query.vnp_ResponseCode || "99"),
    message: successful ? "Thanh toán thành công" : "Thanh toán chưa thành công",
    order
  };
};

export const cancelPendingVnPay = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
      paymentMethod: "vnpay",
      paymentStatus: "unpaid"
    });
    if (order && order.orderStatus !== "cancelled") {
      order.orderStatus = "cancelled";
      await order.save();
    }
    return res.json({ success: true, message: "Đã hủy giao dịch VNPay chưa hoàn tất" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Không thể hủy giao dịch VNPay", error: error.message });
  }
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
