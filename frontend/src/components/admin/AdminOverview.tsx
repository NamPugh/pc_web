import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Truck,
  XCircle,
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
  { status: "pending", label: "Chờ xác nhận", icon: Clock3, color: "#f79009", background: "#fff6ed" },
  { status: "confirmed", label: "Đã xác nhận", icon: PackageCheck, color: "#465fff", background: "#ecf3ff" },
  { status: "shipping", label: "Đang giao", icon: Truck, color: "#7a5af8", background: "#f4f3ff" },
  { status: "completed", label: "Hoàn thành", icon: CheckCircle2, color: "#12b76a", background: "#ecfdf3" },
  { status: "cancelled", label: "Đã hủy", icon: XCircle, color: "#f04438", background: "#fef3f2" },
];

type Props = {
  stats: OrderStats | null;
  loading: boolean;
  onOpenOrders: (status?: Order["orderStatus"]) => void;
};

export default function AdminOverview({ stats, loading, onOpenOrders }: Props) {
  const chartData = stats?.dailyRevenue || [];
  const growth = stats?.monthGrowth || 0;
  const totalOrders = Math.max(stats?.totalOrders || 0, 1);
  const completionRate = Math.min(((stats?.completedOrders || 0) / totalOrders) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const chartWidth = 760;
  const chartHeight = 230;
  const chartPadding = 18;
  const maxRevenue = Math.max(...chartData.map((item) => item.revenue), 1);
  const chartPoints = chartData.map((item, index) => {
    const x = chartData.length > 1
      ? chartPadding + (index / (chartData.length - 1)) * (chartWidth - chartPadding * 2)
      : chartWidth / 2;
    const y = chartHeight - chartPadding - (item.revenue / maxRevenue) * (chartHeight - chartPadding * 2);
    return { ...item, x, y };
  });
  const linePath = chartPoints.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints.at(-1)!.x} ${chartHeight - chartPadding} L ${chartPoints[0].x} ${chartHeight - chartPadding} Z`
    : "";

  const summaryCards = [
    {
      label: "Doanh thu tháng",
      value: currency.format(stats?.monthRevenue || 0),
      helper: "So với tháng trước",
      badge: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
      icon: Banknote,
      positive: growth >= 0,
      accent: "bg-[#ecf3ff] text-[#465fff]",
    },
    {
      label: "Đơn hàng tháng",
      value: String(stats?.monthOrders || 0),
      helper: "Đơn đang chờ xử lý",
      badge: String(stats?.statusCounts.pending || 0),
      icon: ShoppingBag,
      positive: true,
      accent: "bg-[#fff6ed] text-[#f79009]",
    },
    {
      label: "Giá trị trung bình",
      value: currency.format(stats?.averageOrderValue || 0),
      helper: "Trung bình mỗi đơn",
      badge: "AOV",
      icon: ReceiptText,
      positive: true,
      accent: "bg-[#f4f3ff] text-[#7a5af8]",
    },
    {
      label: "Đơn hoàn thành",
      value: String(stats?.completedOrders || 0),
      helper: "Tỷ lệ hoàn thành",
      badge: `${completionRate.toFixed(0)}%`,
      icon: CheckCircle2,
      positive: true,
      accent: "bg-[#ecfdf3] text-[#12b76a]",
    },
  ];

  if (loading) {
    return (
      <div className="grid min-h-[480px] place-items-center rounded-2xl border border-[#eaecf0] bg-white">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#e0e7ff] border-t-[#465fff]" />
          <p className="mt-4 text-sm font-semibold text-[#667085]">Đang tổng hợp số liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <article className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]" key={card.label}>
              <div className="flex items-center justify-between">
                <span className={`grid size-12 place-items-center rounded-xl ${card.accent}`}><Icon className="size-6" /></span>
                <button className="grid size-8 place-items-center rounded-lg text-[#98a2b3] hover:bg-[#f2f4f7]" type="button"><MoreHorizontal className="size-5" /></button>
              </div>
              <p className="mt-5 text-sm font-medium text-[#667085]">{card.label}</p>
              <p className="mt-1 truncate text-2xl font-bold tracking-tight text-[#101828]">{card.value}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${card.positive ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#fef3f2] text-[#b42318]"}`}>
                  {card.label === "Doanh thu tháng" ? <TrendIcon className="size-3.5" /> : null}{card.badge}
                </span>
                <span className="truncate text-xs text-[#98a2b3]">{card.helper}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eaecf0] px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-[#101828]">Tổng quan doanh thu</h2>
              <p className="mt-1 text-sm text-[#667085]">Doanh thu từ đơn đã thanh toán hoặc hoàn thành.</p>
            </div>
            <div className="flex rounded-lg bg-[#f2f4f7] p-1 text-xs font-semibold">
              <span className="rounded-md bg-white px-3 py-1.5 text-[#344054] shadow-sm">7 ngày</span>
              <span className="px-3 py-1.5 text-[#98a2b3]">Tháng</span>
            </div>
          </div>

          <div className="px-3 pb-5 pt-6 sm:px-6">
            <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-2">
              <p className="text-3xl font-bold tracking-tight text-[#101828]">{currency.format(stats?.totalRevenue || 0)}</p>
              <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${growth >= 0 ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#fef3f2] text-[#b42318]"}`}>
                {growth >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(growth).toFixed(1)}%
              </span>
            </div>

            <div className="relative h-[285px] overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[230px] flex-col justify-between">
                {[100, 75, 50, 25, 0].map((value) => <div className="border-t border-dashed border-[#eaecf0]" key={value} />)}
              </div>
              {chartPoints.length ? (
                <svg className="relative h-[230px] w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  <defs>
                    <linearGradient id="adminRevenueArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#465fff" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#465fff" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#adminRevenueArea)" />
                  <path d={linePath} fill="none" stroke="#465fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                  {chartPoints.map((point) => (
                    <g className="group" key={point.date}>
                      <circle cx={point.x} cy={point.y} fill="white" r="7" stroke="#465fff" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                      <title>{currency.format(point.revenue)} · {point.orders} đơn</title>
                    </g>
                  ))}
                </svg>
              ) : <div className="grid h-[230px] place-items-center text-sm text-[#98a2b3]">Chưa có dữ liệu doanh thu.</div>}

              <div className="grid grid-cols-7 gap-1 pt-3 text-center">
                {chartData.map((item) => {
                  const date = new Date(item.date);
                  return (
                    <div key={item.date}>
                      <p className="text-[11px] font-semibold text-[#667085]">{date.toLocaleDateString("vi-VN", { weekday: "short" })}</p>
                      <p className="mt-1 text-[10px] text-[#98a2b3]">{shortCurrency.format(item.revenue)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-lg font-semibold text-[#101828]">Hiệu suất đơn hàng</h2><p className="mt-1 text-sm text-[#667085]">Tỷ lệ hoàn thành toàn hệ thống.</p></div>
            <button className="grid size-8 place-items-center rounded-lg text-[#98a2b3] hover:bg-[#f2f4f7]" type="button"><MoreHorizontal className="size-5" /></button>
          </div>

          <div className="relative mx-auto mt-7 grid size-44 place-items-center">
            <svg className="size-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" fill="none" r="54" stroke="#f2f4f7" strokeWidth="12" />
              <circle
                cx="64"
                cy="64"
                fill="none"
                r="54"
                stroke="#465fff"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - completionRate / 100)}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute text-center"><p className="text-3xl font-bold text-[#101828]">{completionRate.toFixed(0)}%</p><p className="mt-1 text-xs font-medium text-[#98a2b3]">Hoàn thành</p></div>
          </div>

          <div className="mt-5 rounded-xl bg-[#f9fafb] p-4 text-center">
            <p className="text-sm font-semibold text-[#344054]">{stats?.completedOrders || 0} đơn đã hoàn thành</p>
            <p className="mt-1 text-xs leading-5 text-[#98a2b3]">Trên tổng số {stats?.totalOrders || 0} đơn hàng hợp lệ.</p>
          </div>

          <button className="mt-5 w-full rounded-lg border border-[#e4e7ec] py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb]" onClick={() => onOpenOrders()} type="button">Xem tất cả đơn hàng</button>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <div className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-5 sm:px-6">
            <div><h2 className="text-lg font-semibold text-[#101828]">Sản phẩm bán chạy</h2><p className="mt-1 text-sm text-[#667085]">Xếp hạng theo số lượng đã bán.</p></div>
            <button className="rounded-lg border border-[#e4e7ec] px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb]" onClick={() => onOpenOrders()} type="button">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[660px]">
              <div className="grid grid-cols-[minmax(280px,1fr)_120px_150px_120px] bg-[#f9fafb] px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                <span>Sản phẩm</span><span>Đã bán</span><span>Doanh thu</span><span>Hiệu suất</span>
              </div>
              <div className="divide-y divide-[#eaecf0]">
                {(stats?.topProducts || []).map((product, index) => {
                  const maxQuantity = Math.max(...(stats?.topProducts || []).map((item) => item.quantity), 1);
                  const progress = (product.quantity / maxQuantity) * 100;
                  return (
                    <article className="grid grid-cols-[minmax(280px,1fr)_120px_150px_120px] items-center px-6 py-4 text-sm" key={`${product.product || product.name}-${index}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#eaecf0] bg-[#f9fafb] p-1">
                          {product.image ? <img className="h-full w-full object-contain" src={product.image} alt={product.name} /> : <ShoppingBag className="size-5 text-[#98a2b3]" />}
                        </div>
                        <div className="min-w-0"><p className="truncate font-semibold text-[#344054]">{product.name}</p><p className="mt-1 text-xs text-[#98a2b3]">Top #{index + 1}</p></div>
                      </div>
                      <span className="font-semibold text-[#475467]">{product.quantity}</span>
                      <span className="font-semibold text-[#101828]">{shortCurrency.format(product.revenue)}đ</span>
                      <div className="pr-3"><div className="h-2 overflow-hidden rounded-full bg-[#f2f4f7]"><div className="h-full rounded-full bg-[#465fff]" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-[10px] text-[#98a2b3]">{progress.toFixed(0)}%</p></div>
                    </article>
                  );
                })}
                {!stats?.topProducts.length ? <p className="py-12 text-center text-sm text-[#98a2b3]">Chưa có dữ liệu bán hàng.</p> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-lg font-semibold text-[#101828]">Trạng thái đơn hàng</h2><p className="mt-1 text-sm text-[#667085]">Phân bổ theo tiến độ hiện tại.</p></div>
            <button className="grid size-8 place-items-center rounded-lg text-[#98a2b3] hover:bg-[#f2f4f7]" type="button"><MoreHorizontal className="size-5" /></button>
          </div>
          <div className="mt-6 space-y-5">
            {statusItems.map((item) => {
              const Icon = item.icon;
              const count = stats?.statusCounts[item.status] || 0;
              const percentage = (count / totalOrders) * 100;
              return (
                <button className="block w-full text-left" key={item.status} onClick={() => onOpenOrders(item.status)} type="button">
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg" style={{ color: item.color, background: item.background }}><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><b className="text-sm font-semibold text-[#344054]">{item.label}</b><strong className="text-sm text-[#101828]">{count}</strong></span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#f2f4f7]"><span className="block h-full rounded-full" style={{ width: `${percentage}%`, background: item.color }} /></span></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
