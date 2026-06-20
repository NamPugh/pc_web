import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { getErrorMessage, orderApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const orderStatusMap: Record<Order["orderStatus"], { label: string; tone: string; icon: typeof Clock3 }> = {
  pending: { label: "Chờ xác nhận", tone: "bg-[#fff7ed] text-[#c2410c]", icon: Clock3 },
  confirmed: { label: "Đã xác nhận", tone: "bg-[#eff6ff] text-[#2563eb]", icon: CheckCircle2 },
  shipping: { label: "Đang giao hàng", tone: "bg-[#eef4ff] text-[#3278f6]", icon: Truck },
  completed: { label: "Hoàn thành", tone: "bg-[#ecfdf3] text-[#15803d]", icon: PackageCheck },
  cancelled: { label: "Đã hủy", tone: "bg-[#fef2f2] text-[#dc2626]", icon: XCircle },
};

const paymentLabels: Record<Order["paymentMethod"], string> = {
  cod: "Thanh toán khi nhận hàng",
  banking: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const orderSteps: Order["orderStatus"][] = ["pending", "confirmed", "shipping", "completed"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Order["orderStatus"] | "all">("all");
  const [cancellingId, setCancellingId] = useState("");

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.mine();
      setOrders(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void orderApi.mine()
      .then(({ data }) => {
        if (!active) return;
        setOrders(data.data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const statusCounts = useMemo(
    () => orderSteps.concat("cancelled").reduce<Record<string, number>>((result, status) => {
      result[status] = orders.filter((order) => order.orderStatus === status).length;
      return result;
    }, {}),
    [orders],
  );

  const visibleOrders = useMemo(
    () => filter === "all" ? orders : orders.filter((order) => order.orderStatus === filter),
    [filter, orders],
  );

  const cancelOrder = async (order: Order) => {
    if (!window.confirm(`Bạn chắc chắn muốn hủy đơn #${order._id.slice(-8).toUpperCase()}?`)) return;
    setCancellingId(order._id);
    try {
      await orderApi.cancel(order._id);
      toast.success("Đã hủy đơn hàng");
      await loadOrders();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancellingId("");
    }
  };

  return (
    <section className="space-y-5 py-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#29324e]">Đơn hàng của tôi</h1>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#3278f6] hover:text-[#2860c5]" to="/">
          <ArrowLeft className="size-4" /> Tiếp tục mua hàng
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {orderSteps.concat("cancelled").map((status) => {
          const info = orderStatusMap[status];
          const Icon = info.icon;
          return (
            <button
              className={`flex items-center gap-3 border bg-white p-4 text-left transition ${filter === status ? "border-[#3278f6] shadow-[inset_0_-3px_0_#3278f6]" : "border-[#e5e7eb] hover:border-[#9cbcff]"}`}
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              type="button"
            >
              <span className={`grid size-11 shrink-0 place-items-center ${info.tone}`}><Icon className="size-5" /></span>
              <span><b className="block text-xl text-[#1d2939]">{statusCounts[status] || 0}</b><small className="font-semibold text-[#667085]">{info.label}</small></span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid min-h-80 place-items-center border border-[#e5e7eb] bg-white">
          <div className="text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-[#3278f6]" /><p className="mt-3 text-sm font-semibold text-[#8d94ac]">Đang tải đơn hàng...</p></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="grid min-h-96 place-items-center border border-[#e5e7eb] bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-20 place-items-center bg-[#eef4ff] text-[#3278f6]"><ClipboardList className="size-9" /></span>
            <h2 className="mt-5 text-xl font-black text-[#29324e]">Bạn chưa có đơn hàng</h2>
            <p className="mt-2 text-sm text-[#8d94ac]">Khám phá sản phẩm và đặt đơn đầu tiên ngay hôm nay.</p>
            <Button className="mt-5 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" asChild><Link to="/"><ShoppingBag className="size-4" />Mua sản phẩm</Link></Button>
          </div>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="border border-dashed border-[#d0d5dd] bg-white p-12 text-center">
          <PackageCheck className="mx-auto size-9 text-[#98a2b3]" />
          <p className="mt-3 font-bold text-[#344054]">Không có đơn hàng ở trạng thái này.</p>
          <button className="mt-2 text-sm font-bold text-[#3278f6]" onClick={() => setFilter("all")} type="button">Xem tất cả đơn hàng</button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const status = orderStatusMap[order.orderStatus];
            const StatusIcon = status.icon;
            const currentStep = order.orderStatus === "cancelled" ? -1 : orderSteps.indexOf(order.orderStatus);
            const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

            return (
              <article className="border border-[#e5e7eb] bg-white" key={order._id}>
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Mã đơn hàng</p><p className="mt-0.5 font-black text-[#29324e]">#{order._id.slice(-8).toUpperCase()}</p></div>
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Ngày đặt</p><p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#475467]"><CalendarDays className="size-4 text-[#3278f6]" />{new Date(order.createdAt).toLocaleString("vi-VN")}</p></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${status.tone}`}><StatusIcon className="size-4" />{status.label}</span>
                    <span className={`px-3 py-1.5 text-xs font-bold ${order.paymentStatus === "paid" ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#fff7ed] text-[#c2410c]"}`}>{order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
                  </div>
                </header>

                <div className="grid items-start gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="divide-y divide-[#eef0f3] border border-[#e5e7eb]">
                      {order.items.map((item, index) => (
                        <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_120px_140px] sm:items-center" key={`${order._id}-${item.product || item.name}-${index}`}>
                          <img className="size-16 border border-[#e5e7eb] object-contain sm:size-18" src={item.image || "/icons.svg"} alt={item.name} />
                          <div className="min-w-0"><p className="line-clamp-2 font-bold text-[#344054]">{item.name}</p><p className="mt-1 text-xs text-[#8d94ac]">Số lượng: {item.quantity}</p></div>
                          <p className="col-start-2 text-sm text-[#667085] sm:col-auto">{currency.format(item.price)}</p>
                          <strong className="col-start-2 text-[#fb4e4e] sm:col-auto sm:text-right">{currency.format(item.price * item.quantity)}</strong>
                        </div>
                      ))}
                    </div>

                    {order.orderStatus !== "cancelled" ? (
                      <div className="mt-5 hidden grid-cols-4 md:grid">
                        {orderSteps.map((step, index) => {
                          const complete = index <= currentStep;
                          const StepIcon = orderStatusMap[step].icon;
                          return (
                            <div className="relative text-center" key={step}>
                              {index > 0 ? <span className={`absolute right-1/2 top-5 h-0.5 w-full ${index <= currentStep ? "bg-[#3278f6]" : "bg-[#dfe3e8]"}`} /> : null}
                              <span className={`relative z-10 mx-auto grid size-10 place-items-center border-2 ${complete ? "border-[#3278f6] bg-[#3278f6] text-white" : "border-[#d0d5dd] bg-white text-[#98a2b3]"}`}>{index < currentStep ? <Check className="size-5" /> : <StepIcon className="size-4" />}</span>
                              <p className={`mt-2 text-xs font-bold ${complete ? "text-[#3278f6]" : "text-[#98a2b3]"}`}>{orderStatusMap[step].label}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-3 border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-semibold text-[#b91c1c]"><XCircle className="size-5" />Đơn hàng này đã được hủy.</div>
                    )}
                  </div>

                  <aside className="border border-[#e5e7eb] bg-[#f8fafc] p-4">
                    <h3 className="font-black text-[#29324e]">Thông tin đơn hàng</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="flex items-start gap-2"><PackageCheck className="mt-0.5 size-4 shrink-0 text-[#3278f6]" /><span><b className="block text-[#344054]">{order.customerInfo.fullName || "Khách hàng"}</b><span className="text-[#8d94ac]">{order.customerInfo.email || "Chưa có email"}</span></span></p>
                      <p className="flex items-center gap-2 text-[#667085]"><Phone className="size-4 shrink-0 text-[#3278f6]" />{order.customerInfo.phone || "Chưa có số điện thoại"}</p>
                      <p className="flex items-start gap-2 text-[#667085]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#3278f6]" /><span>{order.customerInfo.address || "Chưa có địa chỉ"}</span></p>
                      <p className="flex items-center gap-2 border-t border-[#dfe3e8] pt-3 text-[#667085]"><CreditCard className="size-4 shrink-0 text-[#3278f6]" />{paymentLabels[order.paymentMethod]}</p>
                    </div>
                    {order.note ? <div className="mt-3 border border-[#e5e7eb] bg-white p-3 text-xs leading-5 text-[#667085]"><b className="text-[#344054]">Ghi chú:</b> {order.note}</div> : null}
                    <div className="mt-4 border-t border-[#dfe3e8] pt-4">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-[#667085]">Tổng thanh toán</span><strong className="text-xl font-black text-[#fb4e4e]">{currency.format(order.totalPrice)}</strong></div>
                      {canCancel ? (
                        <Button className="mt-4 h-10 w-full rounded-none border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2]" disabled={cancellingId === order._id} onClick={() => void cancelOrder(order)} type="button" variant="outline">
                          {cancellingId === order._id ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                          Hủy đơn hàng
                        </Button>
                      ) : null}
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
