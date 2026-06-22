import {
  ArrowLeft,
  BadgePercent,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Gauge,
  Images,
  LogOut,
  Menu,
  PackageCheck,
  Package,
  PanelsTopLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Store,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

import { adminApi, getErrorMessage } from "@/api/client";
import AdminOverview from "@/components/admin/AdminOverview";
import BannerManager from "@/components/admin/BannerManager";
import CatalogManager from "@/components/admin/CatalogManager";
import DealManager from "@/components/admin/DealManager";
import HomeSectionManager from "@/components/admin/HomeSectionManager";
import OrderManager from "@/components/admin/OrderManager";
import SiteSettingManager from "@/components/admin/SiteSettingManager";
import UserManager from "@/components/admin/UserManager";
import { useAuthStore } from "@/store/auth";
import type { Order, OrderStats } from "@/types";

type AdminView = "overview" | "orders" | "catalog" | "users" | "deals" | "banners" | "home-sections" | "about";

const navItems: Array<{ id: AdminView; label: string; helper: string; icon: typeof Gauge }> = [
  { id: "overview", label: "Tổng quan", helper: "Doanh thu & vận hành", icon: Gauge },
  { id: "orders", label: "Đơn hàng", helper: "Xử lý và giao hàng", icon: ClipboardList },
  { id: "catalog", label: "Sản phẩm", helper: "Catalog & tồn kho", icon: Package },
  { id: "users", label: "Người dùng", helper: "Tài khoản & phân quyền", icon: UsersRound },
  { id: "deals", label: "Deal giờ vàng", helper: "Giá, thời gian & số lượng", icon: BadgePercent },
  { id: "banners", label: "Banner", helper: "Giao diện website", icon: Images },
  { id: "home-sections", label: "Danh mục trang chủ", helper: "Banner & sản phẩm hiển thị", icon: PanelsTopLeft },
  { id: "about", label: "Về chúng tôi", helper: "Thông tin website & footer", icon: Building2 },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, ready, loadMe, signOut } = useAuthStore();
  const [view, setView] = useState<AdminView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orderFilter, setOrderFilter] = useState<Order["orderStatus"] | "all">("all");

  useEffect(() => {
    if (!ready) void loadMe();
  }, [loadMe, ready]);

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

  const filteredNavItems = useMemo(() => {
    const keyword = menuSearch.trim().toLocaleLowerCase("vi");
    if (!keyword) return navItems;
    return navItems.filter((item) => `${item.label} ${item.helper}`.toLocaleLowerCase("vi").includes(keyword));
  }, [menuSearch]);

  const pendingOrders = orders.filter((order) => order.orderStatus === "pending");

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

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f9fc]">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#dbe7ff] border-t-[#465fff]" />
          <p className="mt-4 text-sm font-semibold text-[#667085]">Đang kiểm tra quyền quản trị...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate replace to="/signin" />;
  if (user.role !== "admin") return <Navigate replace to="/" />;

  const openOrders = (status: Order["orderStatus"] | "all" = "all") => {
    setOrderFilter(status);
    setView("orders");
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  };

  const reloadOrdersAndStats = async () => {
    await Promise.all([loadOrders(), loadStats()]);
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((current) => current.map((order) => order._id === updatedOrder._id ? updatedOrder : order));
    void adminApi.orderStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => undefined);
  };

  const changeView = (nextView: AdminView) => {
    setView(nextView);
    setMobileMenuOpen(false);
    setMenuSearch("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const currentNav = navItems.find((item) => item.id === view)!;

  const sidebarContent = (mobile = false) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-[76px] shrink-0 items-center border-b border-white/10 ${sidebarOpen || mobile ? "justify-between px-5" : "justify-center"}`}>
        {sidebarOpen || mobile ? (
          <button className="text-left" onClick={() => navigate("/admin")} type="button">
            <b className="block text-xl font-bold tracking-tight text-white">Dashboard</b>
          </button>
        ) : null}
        {mobile ? (
          <button className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setMobileMenuOpen(false)} type="button"><X className="size-5" /></button>
        ) : (
          <button className="grid size-9 place-items-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen((current) => !current)} title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"} type="button">
            {sidebarOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {sidebarOpen || mobile ? <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Menu</p> : null}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                className={`group flex h-12 w-full items-center rounded-lg text-left transition ${sidebarOpen || mobile ? "gap-3 px-3" : "justify-center"} ${active ? "bg-[#3278f6] text-white shadow-[0_6px_18px_rgba(50,120,246,0.25)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                key={item.id}
                onClick={() => changeView(item.id)}
                title={item.label}
                type="button"
              >
                <Icon className={`size-5 shrink-0 ${active ? "text-white" : "text-white/55 group-hover:text-white"}`} />
                {sidebarOpen || mobile ? <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.label}</span> : null}
                {active && (sidebarOpen || mobile) ? <ChevronRight className="size-4" /> : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button className={`flex h-11 w-full items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white ${sidebarOpen || mobile ? "gap-3 px-3" : "justify-center"}`} onClick={() => navigate("/")} title="Về trang bán hàng" type="button">
          <ArrowLeft className="size-5 shrink-0" />{sidebarOpen || mobile ? <span className="text-sm font-semibold">Về trang bán hàng</span> : null}
        </button>
        <button className={`mt-1 flex h-11 w-full items-center rounded-lg text-[#ff8b8b] transition hover:bg-[#ff4d4f]/15 hover:text-[#ffb3b3] ${sidebarOpen || mobile ? "gap-3 px-3" : "justify-center"}`} onClick={() => void handleSignOut()} title="Đăng xuất" type="button">
          <LogOut className="size-5 shrink-0" />{sidebarOpen || mobile ? <span className="text-sm font-semibold">Đăng xuất</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="tailadmin-admin min-h-screen bg-[#f7f9fc] text-[#101828]">
      <div className="flex min-h-screen">
        <aside className={`hidden shrink-0 border-r border-white/10 bg-[#29324e] transition-[width] duration-300 lg:block ${sidebarOpen ? "w-[290px]" : "w-[86px]"}`}>
          <div className="sticky top-0 h-screen">{sidebarContent()}</div>
        </aside>

        {mobileMenuOpen ? <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-[#101828]/45 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileMenuOpen(false)} type="button" /> : null}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] bg-[#29324e] shadow-2xl transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {sidebarContent(true)}
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 h-[76px] border-b border-[#eaecf0] bg-white/95 px-4 backdrop-blur sm:px-6 xl:px-8">
            <div className="flex h-full items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#e4e7ec] text-[#475467] lg:hidden" onClick={() => setMobileMenuOpen(true)} type="button"><Menu className="size-5" /></button>
                <div className="relative hidden w-[min(38vw,430px)] md:block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input
                    className="h-11 w-full rounded-lg border border-[#e4e7ec] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10"
                    onChange={(event) => setMenuSearch(event.target.value)}
                    placeholder="Tìm chức năng quản trị..."
                    value={menuSearch}
                  />
                  {menuSearch ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-xl border border-[#eaecf0] bg-white p-2 shadow-[0_12px_30px_rgba(16,24,40,0.12)]">
                      {filteredNavItems.length ? filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        return <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f2f4f7]" key={item.id} onClick={() => changeView(item.id)} type="button"><Icon className="size-4 text-[#465fff]" /><span><b className="block text-sm text-[#344054]">{item.label}</b><small className="text-xs text-[#98a2b3]">{item.helper}</small></span></button>;
                      }) : <p className="px-3 py-5 text-center text-sm text-[#98a2b3]">Không tìm thấy chức năng.</p>}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <button className="relative grid size-11 place-items-center rounded-full border border-[#e4e7ec] text-[#475467] transition hover:bg-[#f9fafb]" onClick={() => { setNotificationsOpen((current) => !current); setProfileOpen(false); }} type="button">
                    <Bell className="size-5" />
                    {pendingOrders.length ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#f04438] ring-2 ring-white" /> : null}
                  </button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-[#eaecf0] bg-white shadow-[0_18px_45px_rgba(16,24,40,0.16)]">
                      <div className="flex items-center justify-between border-b border-[#eaecf0] px-4 py-3"><b className="text-sm">Thông báo</b><span className="rounded-full bg-[#ecf3ff] px-2 py-1 text-[10px] font-bold text-[#465fff]">{pendingOrders.length} mới</span></div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {pendingOrders.slice(0, 5).map((order) => <button className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-[#f9fafb]" key={order._id} onClick={() => openOrders("pending")} type="button"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff6ed] text-[#f79009]"><PackageCheck className="size-5" /></span><span className="min-w-0"><b className="block truncate text-sm text-[#344054]">Đơn #{order._id.slice(-8).toUpperCase()}</b><small className="mt-1 block text-xs text-[#98a2b3]">Đang chờ xác nhận và xử lý.</small></span></button>)}
                        {!pendingOrders.length ? <p className="px-4 py-8 text-center text-sm text-[#98a2b3]">Không có thông báo mới.</p> : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button className="flex items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[#f9fafb]" onClick={() => { setProfileOpen((current) => !current); setNotificationsOpen(false); }} type="button">
                    <span className="grid size-10 place-items-center rounded-full bg-[#465fff] font-black uppercase text-white">{user.userName.slice(0, 1)}</span>
                    <span className="hidden max-w-36 sm:block"><b className="block truncate text-sm text-[#344054]">{user.userName}</b><small className="block truncate text-xs text-[#98a2b3]">Administrator</small></span>
                    <ChevronDown className={`hidden size-4 text-[#667085] transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-[#eaecf0] bg-white p-2 shadow-[0_18px_45px_rgba(16,24,40,0.16)]">
                      <div className="border-b border-[#eaecf0] px-3 py-3"><b className="block truncate text-sm text-[#344054]">{user.userName}</b><small className="mt-1 block truncate text-xs text-[#98a2b3]">{user.email}</small></div>
                      <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#475467] hover:bg-[#f2f4f7]" onClick={() => navigate("/")} type="button"><Store className="size-4" />Xem cửa hàng</button>
                      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#d92d20] hover:bg-[#fef3f2]" onClick={() => void handleSignOut()} type="button"><LogOut className="size-4" />Đăng xuất</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 xl:p-8">
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#667085]"><span>Admin</span><ChevronRight className="size-3.5" /><span className="text-[#465fff]">{currentNav.label}</span></div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">{currentNav.label}</h1>
                </div>
              </div>

              {view === "overview" ? <AdminOverview loading={loadingStats} onOpenOrders={openOrders} stats={stats} /> : null}
              {view === "orders" ? <OrderManager initialStatus={orderFilter} key={orderFilter} loading={loadingOrders} onOrderUpdated={handleOrderUpdated} onReload={reloadOrdersAndStats} orders={orders} /> : null}
              {view === "catalog" ? <CatalogManager /> : null}
              {view === "users" ? <UserManager /> : null}
              {view === "deals" ? <DealManager /> : null}
              {view === "banners" ? <BannerManager /> : null}
              {view === "home-sections" ? <HomeSectionManager /> : null}
              {view === "about" ? <SiteSettingManager /> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
