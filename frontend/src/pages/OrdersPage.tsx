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
      <div className="rounded-lg border border-[#ededed] bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D91605]">Tra cứu đơn hàng</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#29324e]">Đơn hàng của tôi</h1>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-[#ededed] bg-white p-10 text-center text-[#8d94ac] shadow-sm">
          <ClipboardList className="mx-auto mb-3 size-9 text-[#ccc]" />
          Chưa có đơn hàng.
          <div className="mt-4">
            <Button className="rounded-md bg-[#D91605] hover:bg-[#b51204]" asChild>
              <Link to="/">Mua sản phẩm</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="overflow-hidden rounded-lg border border-[#ededed] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f5f5f5] px-4 py-3">
                <div>
                  <p className="font-bold text-[#29324e]">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-[#8d94ac]">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  <span className="rounded bg-[#fff5f5] px-2.5 py-1.5 text-[#D91605]">{order.orderStatus}</span>
                  <span className="rounded bg-[#ededed] px-2.5 py-1.5 text-[#29324e]">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="divide-y divide-[#ededed]">
                {order.items.map((item) => (
                  <div key={`${order._id}-${item.name}`} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_110px_130px] sm:items-center">
                    <span className="font-semibold text-[#29324e]">{item.name} x {item.quantity}</span>
                    <span className="text-[#8d94ac]">{currency.format(item.price)}</span>
                    <span className="font-bold text-[#D91605] sm:text-right">{currency.format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ededed] px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#444]">
                  <PackageCheck className="size-4 text-[#D91605]" />
                  {order.customerInfo.fullName || "Khách hàng"} · {order.customerInfo.phone || "Chưa có SĐT"}
                </p>
                <div className="flex items-center gap-3">
                  <strong className="text-xl font-bold text-[#D91605]">{currency.format(order.totalPrice)}</strong>
                  {order.orderStatus === "pending" || order.orderStatus === "confirmed" ? (
                    <Button className="rounded-md bg-[#D91605] hover:bg-[#b51204]" variant="destructive" onClick={() => void cancelOrder(order._id)}>Hủy đơn</Button>
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
