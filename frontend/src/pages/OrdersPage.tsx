import { ClipboardList, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { getErrorMessage, orderApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.mine();
      setOrders(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialOrders = async () => {
      try {
        const { data } = await orderApi.mine();
        if (!ignore) setOrders(data.data);
      } catch (error) {
        if (!ignore) toast.error(getErrorMessage(error));
      }
    };

    void loadInitialOrders();
    return () => {
      ignore = true;
    };
  }, []);

  const cancelOrder = async (id: string) => {
    try {
      await orderApi.cancel(id);
      toast.success("Đã hủy đơn hàng");
      await loadOrders();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d71920]">Tra cứu đơn hàng</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Đơn hàng của tôi</h1>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <ClipboardList className="mx-auto mb-3 size-9 text-slate-300" />
          Chưa có đơn hàng.
          <div className="mt-4">
            <Button className="rounded-md bg-[#d71920] hover:bg-[#b80d18]" asChild>
              <Link to="/">Mua sản phẩm</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-bold text-slate-950">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  <span className="rounded bg-red-50 px-2.5 py-1.5 text-[#d71920]">{order.orderStatus}</span>
                  <span className="rounded bg-slate-200 px-2.5 py-1.5 text-slate-700">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={`${order._id}-${item.name}`} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_110px_130px] sm:items-center">
                    <span className="font-semibold text-slate-800">{item.name} x {item.quantity}</span>
                    <span className="text-slate-500">{currency.format(item.price)}</span>
                    <span className="font-bold text-[#d71920] sm:text-right">{currency.format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <PackageCheck className="size-4 text-[#d71920]" />
                  {order.customerInfo.fullName || "Khách hàng"} · {order.customerInfo.phone || "Chưa có SĐT"}
                </p>
                <div className="flex items-center gap-3">
                  <strong className="text-xl font-bold text-[#d71920]">{currency.format(order.totalPrice)}</strong>
                  {order.orderStatus === "pending" || order.orderStatus === "confirmed" ? (
                    <Button className="rounded-md bg-[#d71920] hover:bg-[#b80d18]" variant="destructive" onClick={() => void cancelOrder(order._id)}>Hủy đơn</Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
