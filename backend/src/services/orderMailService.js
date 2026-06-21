import { sendMail } from "./mailService.js";

const statusDetails = {
  confirmed: {
    label: "Đã xác nhận",
    subject: "Đơn hàng của bạn đã được xác nhận",
    message: "HNH đã xác nhận đơn hàng và đang chuẩn bị sản phẩm cho bạn.",
    color: "#4f46e5"
  },
  shipping: {
    label: "Đang giao hàng",
    subject: "Đơn hàng của bạn đang được giao",
    message: "Đơn hàng đã rời cửa hàng và đang trên đường giao đến địa chỉ nhận hàng.",
    color: "#7c3aed"
  },
  completed: {
    label: "Hoàn thành",
    subject: "Đơn hàng đã được giao thành công",
    message: "Cảm ơn bạn đã mua sắm tại HNH. Hy vọng bạn hài lòng với sản phẩm.",
    color: "#059669"
  },
  cancelled: {
    label: "Đã hủy",
    subject: "Đơn hàng đã được hủy",
    message: "Đơn hàng của bạn đã được chuyển sang trạng thái hủy.",
    color: "#dc2626"
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const renderItems = (items = []) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;">
            ${escapeHtml(item.name)}
            <div style="margin-top:4px;color:#6b7280;font-size:12px;">Số lượng: ${Number(item.quantity || 0)}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;font-weight:700;">
            ${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
          </td>
        </tr>
      `
    )
    .join("");

export const sendOrderStatusEmail = async (order, nextStatus = order?.orderStatus) => {
  const detail = statusDetails[nextStatus];
  const recipient = String(order?.customerInfo?.email || order?.user?.email || "").trim();
  if (!detail || !recipient) return { skipped: true };

  const frontendUrl = String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const customerName = escapeHtml(order.customerInfo?.fullName || order.user?.userName || "quý khách");
  const orderId = escapeHtml(order._id);
  const orderUrl = `${frontendUrl}/orders`;

  const html = `
    <!doctype html>
    <html lang="vi">
      <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="padding:32px 16px;">
          <div style="max-width:640px;margin:0 auto;overflow:hidden;background:#ffffff;border:1px solid #e5e7eb;">
            <div style="padding:24px 28px;background:#29324e;color:#ffffff;">
              <div style="font-size:22px;font-weight:800;letter-spacing:1px;">HNH</div>
              <div style="margin-top:6px;color:#cbd5e1;font-size:13px;">Cập nhật trạng thái đơn hàng</div>
            </div>

            <div style="padding:28px;">
              <div style="display:inline-block;padding:7px 12px;background:${detail.color}15;color:${detail.color};font-size:12px;font-weight:700;">
                ${detail.label}
              </div>
              <h1 style="margin:18px 0 10px;font-size:24px;line-height:1.35;">${detail.subject}</h1>
              <p style="margin:0;color:#4b5563;line-height:1.7;">Xin chào ${customerName},</p>
              <p style="margin:8px 0 0;color:#4b5563;line-height:1.7;">${detail.message}</p>

              <div style="margin-top:24px;padding:18px;background:#f8fafc;border:1px solid #e5e7eb;">
                <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Mã đơn hàng</div>
                <div style="margin-top:5px;font-weight:700;">#${orderId}</div>
              </div>

              <table style="width:100%;margin-top:18px;border-collapse:collapse;font-size:14px;">
                <tbody>${renderItems(order.items)}</tbody>
                <tfoot>
                  <tr>
                    <td style="padding-top:18px;font-weight:700;">Tổng thanh toán</td>
                    <td style="padding-top:18px;text-align:right;color:#dc2626;font-size:18px;font-weight:800;">
                      ${formatCurrency(order.totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <a href="${orderUrl}" style="display:inline-block;margin-top:26px;padding:13px 20px;background:#3278f6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
                Xem đơn hàng của tôi
              </a>

              <p style="margin:26px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Đây là email tự động từ HNH. Bạn không cần trả lời email này.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    detail.subject,
    `Xin chào ${order.customerInfo?.fullName || order.user?.userName || "quý khách"},`,
    detail.message,
    `Mã đơn hàng: #${order._id}`,
    `Tổng thanh toán: ${formatCurrency(order.totalPrice)}`,
    `Xem đơn hàng: ${orderUrl}`
  ].join("\n");

  return sendMail({
    to: recipient,
    subject: `[HNH] ${detail.subject} - #${order._id}`,
    html,
    text
  });
};

export const notifyOrderStatusChange = (order, previousStatus) => {
  if (!order || order.orderStatus === previousStatus || !statusDetails[order.orderStatus]) return;

  void sendOrderStatusEmail(order).catch((error) => {
    console.error(`Không thể gửi email trạng thái đơn hàng ${order._id}:`, error.message);
  });
};

