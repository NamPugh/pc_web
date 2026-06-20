import crypto from "crypto";

const encode = (value) => encodeURIComponent(String(value)).replace(/%20/g, "+");

const serialize = (params) =>
  Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");

const formatVnPayDate = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
};

export const getVnPayConfig = () => ({
  tmnCode: process.env.VNPAY_TMN_CODE,
  hashSecret: process.env.VNPAY_HASH_SECRET,
  paymentUrl: process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5173/payment/vnpay-return"
});

export const createVnPayUrl = ({ order, ipAddress }) => {
  const config = getVnPayConfig();
  if (!config.tmnCode || !config.hashSecret) {
    throw new Error("VNPAY chưa được cấu hình trên máy chủ");
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
  const params = {
    vnp_Amount: Math.round(order.totalPrice * 100),
    vnp_Command: "pay",
    vnp_CreateDate: formatVnPayDate(createdAt),
    vnp_CurrCode: "VND",
    vnp_ExpireDate: formatVnPayDate(expiresAt),
    vnp_IpAddr: ipAddress || "127.0.0.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang ${order._id}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: config.returnUrl,
    vnp_TmnCode: config.tmnCode,
    vnp_TxnRef: order._id.toString(),
    vnp_Version: "2.1.0"
  };
  const query = serialize(params);
  const signature = crypto.createHmac("sha512", config.hashSecret).update(query, "utf8").digest("hex");
  return `${config.paymentUrl}?${query}&vnp_SecureHash=${signature}`;
};

export const verifyVnPayResponse = (query) => {
  const config = getVnPayConfig();
  if (!config.hashSecret) return false;

  const params = Object.fromEntries(
    Object.entries(query).filter(([key]) => key.startsWith("vnp_") && !["vnp_SecureHash", "vnp_SecureHashType"].includes(key))
  );
  const signature = crypto.createHmac("sha512", config.hashSecret).update(serialize(params), "utf8").digest("hex");
  const received = String(query.vnp_SecureHash || "");
  if (!received || received.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(signature));
};
