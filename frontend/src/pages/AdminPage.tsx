import { ArrowLeft, BarChart3, Boxes, Flame, Image, LayoutDashboard, LogOut, Menu, PackageCheck, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

import { adminApi, getErrorMessage } from "@/api/client";
import AdminOverview from "@/components/admin/AdminOverview";
import BannerManager from "@/components/admin/BannerManager";
import CatalogManager from "@/components/admin/CatalogManager";
import DealManager from "@/components/admin/DealManager";
import OrderManager from "@/components/admin/OrderManager";
import { useAuthStore } from "@/store/auth";
import type { Order, OrderStats } from "@/types";

type AdminView = "overview" | "orders" | "catalog" | "deals" | "banners";

const navItems: Array<{ id: AdminView; label: string; helper: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Tổng quan", helper: "Doanh thu & vận hành", icon: LayoutDashboard },
  { id: "orders", label: "Đơn hàng", helper: "Xử lý và giao hàng", icon: PackageCheck },
  { id: "catalog", label: "Sản phẩm", helper: "Catalog & tồn kho", icon: Boxes },
  { id: "deals", label: "Deal giờ vàng", helper: "Giá, thời gian & số lượng", icon: Flame },
  { id: "banners", label: "Banner", helper: "Giao diện website", icon: Image },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, ready, loadMe, signOut } = useAuthStore();
  const [view, setView] = useState<AdminView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orderFilter, setOrderFilter] = useState<Order["orderStatus"] | "all">("all");

  useEffect(() => {
    if (!ready) void loadMe();
  }, [loadMe, ready]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await adminApi.orders();
      setOrders(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await adminApi.orderStats();
      setStats(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;

    let active = true;
    void Promise.all([adminApi.orders(), adminApi.orderStats()])
      .then(([orderResponse, statsResponse]) => {
        if (!active) return;
        setOrders(orderResponse.data.data);
        setStats(statsResponse.data.data);
        setLoadingOrders(false);
        setLoadingStats(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
        setLoadingOrders(false);
        setLoadingStats(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!ready) {
    return <div className="grid min-h-[70vh] place-items-center text-sm font-semibold text-[#667085]">Đang kiểm tra quyền quản trị...</div>;
  }

  if (!user) return <Navigate replace to="/signin" />;
  if (user.role !== "admin") return <Navigate replace to="/" />;

  const openOrders = (status: Order["orderStatus"] | "all" = "all") => {
    setOrderFilter(status);
    setView("orders");
    setMobileMenuOpen(false);
  };

  const reloadOrdersAndStats = async () => {
    await Promise.all([loadOrders(), loadStats()]);
  };

  const changeView = (nextView: AdminView) => {
    setView(nextView);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const currentNav = navItems.find((item) => item.id === view)!;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="flex min-h-screen">
        <aside className={`hidden shrink-0 border-r border-[#e5e7eb] bg-[#101828] text-white transition-[width] duration-200 lg:block ${sidebarOpen ? "w-64" : "w-[76px]"}`}>
          <div className="sticky top-0 flex h-screen flex-col">
            <div className={`flex h-20 items-center border-b border-white/10 ${sidebarOpen ? "justify-between px-5" : "justify-center"}`}>
              <div className={`items-center gap-3 ${sidebarOpen ? "flex" : "hidden"}`}>
                <span className="grid size-10 place-items-center rounded-lg bg-[#3278f6]"><ShieldCheck className="size-5" /></span>
                <div><p className="font-black tracking-tight">PC WEB</p><p className="text-[11px] font-semibold text-white/50">ADMIN CENTER</p></div>
              </div>
              <button className="grid size-9 place-items-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen((current) => !current)} title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"} type="button">
                {sidebarOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button className={`flex h-14 w-full items-center rounded-lg text-left transition ${sidebarOpen ? "gap-3 px-3" : "justify-center"} ${active ? "bg-[#3278f6] text-white shadow-lg shadow-[#3278f6]/20" : "text-white/65 hover:bg-white/10 hover:text-white"}`} key={item.id} onClick={() => changeView(item.id)} title={item.label} type="button">
                    <Icon className="size-5 shrink-0" />
                    {sidebarOpen ? <span className="min-w-0"><b className="block text-sm">{item.label}</b><small className={`block truncate text-[11px] ${active ? "text-white/70" : "text-white/40"}`}>{item.helper}</small></span> : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <button className={`mb-1 flex h-12 w-full items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white ${sidebarOpen ? "gap-3 px-3" : "justify-center"}`} onClick={() => navigate("/")} title="Về trang bán hàng" type="button">
                <ArrowLeft className="size-5 shrink-0" />{sidebarOpen ? <span className="text-sm font-bold">Về trang bán hàng</span> : null}
              </button>
              <button className={`flex h-12 w-full items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white ${sidebarOpen ? "gap-3 px-3" : "justify-center"}`} onClick={() => void handleSignOut()} title="Đăng xuất" type="button">
                <LogOut className="size-5 shrink-0" />{sidebarOpen ? <span className="text-sm font-bold">Đăng xuất</span> : null}
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen ? <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-[#101828]/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} type="button" /> : null}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#101828] p-4 text-white shadow-2xl transition-transform lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-6 flex items-center gap-3 px-2 py-3"><span className="grid size-10 place-items-center rounded-lg bg-[#3278f6]"><ShieldCheck className="size-5" /></span><div><p className="font-black">PC WEB</p><p className="text-xs text-white/50">ADMIN CENTER</p></div></div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <button className={`flex h-14 w-full items-center gap-3 rounded-lg px-3 text-left ${view === item.id ? "bg-[#3278f6]" : "text-white/70"}`} key={item.id} onClick={() => changeView(item.id)} type="button"><Icon className="size-5" /><span><b className="block text-sm">{item.label}</b><small className="text-white/50">{item.helper}</small></span></button>;
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <button className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white" onClick={() => navigate("/")} type="button">
              <ArrowLeft className="size-5" />
              Về trang bán hàng
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="grid size-10 place-items-center border border-[#e5e7eb] text-[#475467] lg:hidden" onClick={() => setMobileMenuOpen(true)} type="button"><Menu className="size-5" /></button>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#3278f6]"><BarChart3 className="size-4" />Quản trị cửa hàng</div>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1d2939]">{currentNav.label}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#344054]">{user.userName}</p><p className="text-xs text-[#8d94ac]">{user.email}</p></div>
                <span className="grid size-10 place-items-center rounded-full bg-[#eef4ff] font-black uppercase text-[#3278f6]">{user.userName.slice(0, 1)}</span>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            {view === "overview" ? <AdminOverview loading={loadingStats} onOpenOrders={openOrders} stats={stats} /> : null}
            {view === "orders" ? <OrderManager initialStatus={orderFilter} key={orderFilter} loading={loadingOrders} onReload={reloadOrdersAndStats} orders={orders} /> : null}
            {view === "catalog" ? <CatalogManager /> : null}
            {view === "deals" ? <DealManager /> : null}
            {view === "banners" ? <BannerManager /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
