import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Truck,
} from "lucide-react";

import type { Order, OrderStats } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const shortCurrency = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const statusItems: Array<{
  status: Order["orderStatus"];
  label: string;
  icon: typeof Clock3;
  color: string;
  background: string;
}> = [
  { status: "pending", label: "Chờ xác nhận", icon: Clock3, color: "#d97706", background: "#fff7ed" },
  { status: "confirmed", label: "Đã xác nhận", icon: PackageCheck, color: "#2563eb", background: "#eff6ff" },
  { status: "shipping", label: "Đang giao", icon: Truck, color: "#7c3aed", background: "#f5f3ff" },
  { status: "completed", label: "Hoàn thành", icon: CheckCircle2, color: "#16a34a", background: "#f0fdf4" },
];

type Props = {
  stats: OrderStats | null;
  loading: boolean;
  onOpenOrders: (status?: Order["orderStatus"]) => void;
};

export default function AdminOverview({ stats, loading, onOpenOrders }: Props) {
  const chartData = stats?.dailyRevenue || [];
  const maxRevenue = Math.max(...chartData.map((item) => item.revenue), 1);
  const growth = stats?.monthGrowth || 0;

  const summaryCards = [
    {
      label: "Doanh thu tháng",
      value: currency.format(stats?.monthRevenue || 0),
      helper: `${Math.abs(growth).toFixed(1)}% so với tháng trước`,
      icon: Banknote,
      positive: growth >= 0,
      accent: "bg-[#eef4ff] text-[#3278f6]",
    },
    {
      label: "Đơn hàng tháng",
      value: String(stats?.monthOrders || 0),
      helper: `${stats?.statusCounts.pending || 0} đơn đang chờ xử lý`,
      icon: ShoppingBag,
      positive: true,
      accent: "bg-[#fff7ed] text-[#d97706]",
    },
    {
      label: "Giá trị trung bình",
      value: currency.format(stats?.averageOrderValue || 0),
      helper: "Trên mỗi đơn đã ghi nhận",
      icon: ReceiptText,
      positive: true,
      accent: "bg-[#f5f3ff] text-[#7c3aed]",
    },
    {
      label: "Đơn hoàn thành",
      value: String(stats?.completedOrders || 0),
      helper: `${stats?.totalOrders || 0} đơn hợp lệ toàn hệ thống`,
      icon: CheckCircle2,
      positive: true,
      accent: "bg-[#f0fdf4] text-[#16a34a]",
    },
  ];

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center border border-[#e5e7eb] bg-white">
        <div className="text-center">
          <div className="mx-auto size-9 animate-spin rounded-full border-4 border-[#dbe7ff] border-t-[#3278f6]" />
          <p className="mt-3 text-sm font-semibold text-[#8d94ac]">Đang tổng hợp số liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <article className="border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" key={card.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#667085]">{card.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-[#1d2939]">{card.value}</p>
                </div>
                <span className={`grid size-11 place-items-center rounded-lg ${card.accent}`}>
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8d94ac]">
                {card.label === "Doanh thu tháng" ? (
                  <TrendIcon className={`size-4 ${card.positive ? "text-[#16a34a]" : "text-[#dc2626]"}`} />
                ) : null}
                {card.helper}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        <section className="border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d2939]">Doanh thu 7 ngày gần nhất</h2>
              <p className="mt-1 text-sm text-[#8d94ac]">Tính trên đơn đã thanh toán hoặc hoàn thành.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8d94ac]">Tổng doanh thu</p>
              <p className="mt-1 font-bold text-[#3278f6]">{currency.format(stats?.totalRevenue || 0)}</p>
            </div>
          </div>

          <div className="mt-8 grid h-64 grid-cols-7 items-end gap-2 sm:gap-4">
            {chartData.map((item) => {
              const height = item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 8) : 3;
              const date = new Date(item.date);
              return (
                <div className="group flex h-full min-w-0 flex-col justify-end" key={item.date}>
                  <div className="relative flex flex-1 items-end justify-center">
                    <div className="invisible absolute bottom-[calc(100%+8px)] z-10 whitespace-nowrap rounded bg-[#1d2939] px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                      {currency.format(item.revenue)} · {item.orders} đơn
                    </div>
                    <div
                      className="w-full max-w-12 rounded-t bg-gradient-to-t from-[#3278f6] to-[#72a3ff] transition group-hover:from-[#2860c5] group-hover:to-[#3278f6]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-[11px] font-bold text-[#667085]">
                      {date.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[#98a2b3]">{shortCurrency.format(item.revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-lg font-bold text-[#1d2939]">Trạng thái đơn hàng</h2>
          <p className="mt-1 text-sm text-[#8d94ac]">Bấm vào trạng thái để xử lý nhanh.</p>
          <div className="mt-5 space-y-3">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className="flex w-full items-center gap-3 border border-[#eef0f3] p-3 text-left transition hover:border-[#cbdcff] hover:bg-[#f9fbff]"
                  key={item.status}
                  onClick={() => onOpenOrders(item.status)}
                  type="button"
                >
                  <span className="grid size-10 place-items-center rounded-lg" style={{ color: item.color, background: item.background }}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm text-[#344054]">{item.label}</b>
                    <small className="text-xs text-[#98a2b3]">Xem danh sách đơn</small>
                  </span>
                  <strong className="text-xl text-[#1d2939]">{stats?.statusCounts[item.status] || 0}</strong>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1d2939]">Sản phẩm bán chạy</h2>
            <p className="mt-1 text-sm text-[#8d94ac]">Xếp hạng theo số lượng trong các đơn không bị hủy.</p>
          </div>
          <button className="text-sm font-bold text-[#3278f6] hover:text-[#2860c5]" onClick={() => onOpenOrders()} type="button">
            Xem đơn hàng
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(stats?.topProducts || []).map((product, index) => (
            <article className="flex items-center gap-3 border border-[#eef0f3] p-3" key={`${product.product || product.name}-${index}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-xs font-black text-[#3278f6]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#344054]">{product.name}</p>
                <p className="mt-1 text-xs text-[#8d94ac]">{product.quantity} sản phẩm · {shortCurrency.format(product.revenue)}đ</p>
              </div>
            </article>
          ))}
          {!stats?.topProducts.length ? (
            <p className="col-span-full py-6 text-center text-sm text-[#8d94ac]">Chưa có dữ liệu bán hàng.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
