import { ChevronRight, PackageOpen, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { adminApi, getErrorMessage } from "@/api/client";
import AdminSelect from "@/components/admin/AdminSelect";
import type { Order } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const orderStatuses: Array<{ value: Order["orderStatus"]; label: string }> = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao hàng" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusStyle: Record<Order["orderStatus"], string> = {
  pending: "!border-[#fed7aa] !bg-[#fff7ed] !text-[#c2410c]",
  confirmed: "!border-[#bfdbfe] !bg-[#eff6ff] !text-[#1d4ed8]",
  shipping: "!border-[#ddd6fe] !bg-[#f5f3ff] !text-[#6d28d9]",
  completed: "!border-[#bbf7d0] !bg-[#f0fdf4] !text-[#15803d]",
  cancelled: "!border-[#fecaca] !bg-[#fef2f2] !text-[#b91c1c]",
};

type Props = {
  orders: Order[];
  loading: boolean;
  initialStatus?: Order["orderStatus"] | "all";
  onReload: () => Promise<void>;
  onOrderUpdated: (order: Order) => void;
};

export default function OrderManager({ orders, loading, initialStatus = "all", onReload, onOrderUpdated }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Order["orderStatus"] | "all">(initialStatus);
  const [payment, setPayment] = useState<Order["paymentStatus"] | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState("");

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesKeyword =
        !keyword ||
        order._id.toLowerCase().includes(keyword) ||
        order.customerInfo.fullName?.toLowerCase().includes(keyword) ||
        order.customerInfo.phone?.toLowerCase().includes(keyword) ||
        order.customerInfo.email?.toLowerCase().includes(keyword);
      return matchesKeyword &&
        (status === "all" || order.orderStatus === status) &&
        (payment === "all" || order.paymentStatus === payment);
    });
  }, [orders, payment, search, status]);

  const updateOrder = async (
    order: Order,
    payload: { orderStatus?: Order["orderStatus"]; paymentStatus?: Order["paymentStatus"] },
  ) => {
    setUpdatingId(order._id);
    try {
      const { data } = await adminApi.updateOrder(order._id, payload);
      if (selectedOrder?._id === order._id) setSelectedOrder(data.data);
      onOrderUpdated(data.data);
      toast.success("Đã cập nhật đơn hàng");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <section className="border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="border-b border-[#e5e7eb] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1d2939]">Quản lý đơn hàng</h2>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 border border-[#d0d5dd] px-3 text-sm font-bold text-[#344054] transition hover:bg-[#f9fafb]"
            onClick={() => void onReload()}
            type="button"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_190px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
            <input
              className="h-11 w-full border border-[#d0d5dd] pl-10 pr-3 text-sm outline-none transition focus:border-[#3278f6] focus:ring-2 focus:ring-[#3278f6]/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
              value={search}
            />
          </label>
          <AdminSelect options={[{ value: "all", label: "Tất cả trạng thái" }, ...orderStatuses]} onValueChange={(value) => setStatus(value as typeof status)} value={status} />
          <AdminSelect options={[{ value: "all", label: "Mọi thanh toán" }, { value: "unpaid", label: "Chưa thanh toán" }, { value: "paid", label: "Đã thanh toán" }]} onValueChange={(value) => setPayment(value as typeof payment)} value={payment} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">
          <div className="grid grid-cols-[130px_minmax(220px,1fr)_150px_160px_180px_55px] bg-[#f9fafb] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
            <span>Mã đơn</span>
            <span>Khách hàng</span>
            <span>Ngày đặt</span>
            <span>Tổng tiền</span>
            <span>Trạng thái</span>
            <span />
          </div>
          <div className="divide-y divide-[#eef0f3]">
            {loading ? (
              <div className="p-10 text-center text-sm font-semibold text-[#8d94ac]">Đang tải đơn hàng...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="grid place-items-center p-12 text-center">
                <PackageOpen className="size-10 text-[#cbd5e1]" />
                <p className="mt-3 font-bold text-[#475467]">Không tìm thấy đơn hàng</p>
                <p className="mt-1 text-sm text-[#98a2b3]">Hãy thử thay đổi bộ lọc hoặc từ khóa.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div className="grid grid-cols-[130px_minmax(220px,1fr)_150px_160px_180px_55px] items-center px-5 py-4 text-sm" key={order._id}>
                  <button className="text-left font-black text-[#3278f6] hover:underline" onClick={() => setSelectedOrder(order)} type="button">
                    #{order._id.slice(-8).toUpperCase()}
                  </button>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#344054]">{order.customerInfo.fullName || "Khách hàng"}</p>
                    <p className="mt-0.5 truncate text-xs text-[#8d94ac]">{order.customerInfo.phone || order.customerInfo.email || "Chưa có liên hệ"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#475467]">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                    <p className="mt-0.5 text-xs text-[#98a2b3]">{new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div>
                    <p className="font-black text-[#1d2939]">{currency.format(order.totalPrice)}</p>
                    <button
                      className={`mt-1 text-xs font-bold ${order.paymentStatus === "paid" ? "text-[#16a34a]" : "text-[#d97706]"}`}
                      disabled={updatingId === order._id}
                      onClick={() => void updateOrder(order, { paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid" })}
                      type="button"
                    >
                      {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </button>
                  </div>
                  <AdminSelect className={`h-9 w-full !rounded-lg border text-xs shadow-none ${statusStyle[order.orderStatus]}`} disabled={updatingId === order._id} options={orderStatuses} onValueChange={(value) => void updateOrder(order, { orderStatus: value as Order["orderStatus"] })} value={order.orderStatus} />
                  <button className="grid size-9 place-items-center text-[#667085] transition hover:bg-[#eef4ff] hover:text-[#3278f6]" onClick={() => setSelectedOrder(order)} title="Xem chi tiết" type="button">
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-[#e5e7eb] px-5 py-3 text-sm font-semibold text-[#667085]">
        Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[80] flex justify-end bg-[#101828]/50 backdrop-blur-[2px]" onMouseDown={() => setSelectedOrder(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#3278f6]">Chi tiết đơn hàng</p>
                <h3 className="mt-1 text-xl font-black text-[#1d2939]">#{selectedOrder._id.slice(-8).toUpperCase()}</h3>
              </div>
              <button className="grid size-10 place-items-center text-[#667085] hover:bg-[#f2f4f7]" onClick={() => setSelectedOrder(null)} type="button">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#667085]">Trạng thái</span>
                  <AdminSelect className="w-full" options={orderStatuses} onValueChange={(value) => void updateOrder(selectedOrder, { orderStatus: value as Order["orderStatus"] })} value={selectedOrder.orderStatus} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#667085]">Thanh toán</span>
                  <AdminSelect className="w-full" options={[{ value: "unpaid", label: "Chưa thanh toán" }, { value: "paid", label: "Đã thanh toán" }]} onValueChange={(value) => void updateOrder(selectedOrder, { paymentStatus: value as Order["paymentStatus"] })} value={selectedOrder.paymentStatus} />
                </label>
              </div>

              <div className="border border-[#e5e7eb] p-4">
                <h4 className="font-bold text-[#1d2939]">Thông tin khách hàng</h4>
                <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                  <dt className="text-[#8d94ac]">Họ tên</dt><dd className="font-semibold text-[#344054]">{selectedOrder.customerInfo.fullName || "—"}</dd>
                  <dt className="text-[#8d94ac]">Điện thoại</dt><dd className="font-semibold text-[#344054]">{selectedOrder.customerInfo.phone || "—"}</dd>
                  <dt className="text-[#8d94ac]">Email</dt><dd className="break-all font-semibold text-[#344054]">{selectedOrder.customerInfo.email || "—"}</dd>
                  <dt className="text-[#8d94ac]">Địa chỉ</dt><dd className="font-semibold leading-6 text-[#344054]">{selectedOrder.customerInfo.address || "—"}</dd>
                </dl>
              </div>

              <div>
                <h4 className="font-bold text-[#1d2939]">Sản phẩm ({selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)})</h4>
                <div className="mt-3 divide-y divide-[#eef0f3] border border-[#e5e7eb]">
                  {selectedOrder.items.map((item, index) => (
                    <div className="flex gap-3 p-3" key={`${item.name}-${index}`}>
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden bg-[#f2f4f7]">
                        {item.image ? <img className="h-full w-full object-cover" src={item.image} alt={item.name} /> : <PackageOpen className="size-5 text-[#98a2b3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-5 text-[#344054]">{item.name}</p>
                        <p className="mt-1 text-xs text-[#8d94ac]">{currency.format(item.price)} × {item.quantity}</p>
                      </div>
                      <strong className="shrink-0 text-sm text-[#1d2939]">{currency.format(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between bg-[#f9fafb] p-4">
                  <span className="font-bold text-[#475467]">Tổng thanh toán</span>
                  <strong className="text-xl text-[#3278f6]">{currency.format(selectedOrder.totalPrice)}</strong>
                </div>
              </div>

              {selectedOrder.note ? (
                <div className="border border-[#fde68a] bg-[#fffbeb] p-4">
                  <h4 className="text-sm font-bold text-[#92400e]">Ghi chú khách hàng</h4>
                  <p className="mt-1 text-sm leading-6 text-[#a16207]">{selectedOrder.note}</p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
