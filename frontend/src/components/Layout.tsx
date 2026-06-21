import { Boxes, ChevronDown, ChevronRight, CircleUserRound, ClipboardList, Cpu, Gamepad2, Headphones, Laptop, LayoutGrid, LogIn, LogOut, Mail, MapPin, MapPinned, Menu, Monitor, PackageCheck, Phone, Search, ShoppingCart, UserPlus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { catalogApi, siteSettingApi } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import type { Category, SiteSetting } from "@/types";

const navItems = [
  { to: "/build-pc", label: "Build PC" },
  { to: "/?keyword=PC%20Gaming", label: "PC Gaming" },
  { to: "/?keyword=PC%20%C4%90%E1%BB%93%20H%E1%BB%8Da%20AI", label: "PC Đồ Họa AI" },
  { to: "/?keyword=M%C3%A0n%20h%C3%ACnh%20gaming", label: "Màn Hình Gaming" },
  { to: "/?keyword=Laptop%20Gaming", label: "Laptop Gaming" },
  { to: "/?keyword=PS5%20Slim", label: "PS5 Slim" },
  { to: "/?keyword=RTX%205060", label: "RTX 5060" },
  { to: "/?keyword=RTX%205070", label: "RTX 5070" },
  { to: "/?keyword=RTX%205080", label: "RTX 5080" },
  { to: "/?keyword=RX%209070", label: "RX 9070" },
  { to: "/?keyword=M%C3%A1y%20in", label: "Máy In" },
];

const categoryItems = [
  { label: "Xây dựng cấu hình PC", helper: "PC AMD / PC Cao Cấp", keyword: "Build PC", icon: Cpu },
  { label: "PC Gaming", helper: "Giá tốt, sẵn hàng", keyword: "PC Gaming", icon: Boxes },
  { label: "PC Đồ Họa AI", helper: "Tối ưu công việc", keyword: "PC Đồ Họa AI", icon: Cpu },
  { label: "Laptop - Máy Tính Xách Tay", helper: "Gaming / Văn phòng", keyword: "Laptop", icon: Laptop },
  { label: "Màn Hình Máy Tính", helper: "Gaming / Đồ họa", keyword: "Màn hình", icon: Monitor },
  { label: "Máy chơi game - Console", helper: "PS5 / Nintendo Switch", keyword: "PS5", icon: Gamepad2 },
  { label: "VGA - Card màn hình", helper: "RTX 5060 / RTX 5070", keyword: "RTX", icon: Boxes },
  { label: "Linh kiện máy tính", helper: "CPU / Mainboard / RAM", keyword: "CPU RAM SSD", icon: PackageCheck },
  { label: "Gaming Gears", helper: "Bàn phím / Chuột / Tai nghe", keyword: "Gaming Gear", icon: Headphones },
  { label: "Thiết bị văn phòng", helper: "Máy in / Camera", keyword: "Máy in", icon: PackageCheck },
  { label: "Thiết bị mạng", helper: "Router / Wifi / Switch", keyword: "Router Wifi", icon: PackageCheck },
];

const footerGroups = [
  {
    title: "Danh Mục Sản Phẩm",
    items: [
      { label: "PC Gaming", href: "/?keyword=PC%20Gaming" },
      { label: "Laptop Gaming", href: "/?keyword=Laptop%20Gaming" },
      { label: "Màn Hình", href: "/?keyword=M%C3%A0n%20h%C3%ACnh" },
      { label: "VGA RTX", href: "/?keyword=RTX" },
      { label: "PS5 Slim", href: "/?keyword=PS5%20Slim" },
    ],
  },
  {
    title: "Thông Tin Chung",
    items: [
      { label: "Tài khoản", href: "/account" },
    ],
  },
  {
    title: "Hỗ Trợ Nhanh",
    items: [
      { label: "Build PC", href: "/build-pc" },
      { label: "Tư Vấn Cấu Hình", href: "/build-pc" },
      { label: "Theo Dõi Đơn Hàng", href: "/orders" },
      { label: "Thanh Toán", href: "/cart" },
    ],
  },
];

const defaultSiteSetting: SiteSetting = {
  phone: "086 830 2123",
  email: "cskh@tncstore.vn",
  footerTitle: "PC Web",
  footerDescription: "Cửa hàng linh kiện PC với danh mục nhanh, deal nổi bật, build cấu hình và khu vực sản phẩm rõ ràng.",
  showroomAddress: "114 Chiến Thắng, Hà Nội",
  warrantyAddress: "114 Chiến Thắng, Hà Nội",
  newsletterTitle: "Đăng ký email để nhận tin khuyến mãi",
  newsletterDescription: "Nhận deal PC gaming, VGA, laptop và gaming gear mới nhất.",
  copyright: "© 2026 PC Web",
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ready, loadMe, signOut } = useAuthStore();
  const { cart, loadCart, resetCart } = useCartStore();
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [siteSetting, setSiteSetting] = useState<SiteSetting>(defaultSiteSetting);
  const cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    let active = true;
    void Promise.all([siteSettingApi.get(), catalogApi.categories()])
      .then(([settingResponse, categoryResponse]) => {
        if (!active) return;
        setSiteSetting(settingResponse.data.data);
        setCategories(categoryResponse.data.data.filter((category) => category.isActive !== false));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) void loadCart();
    else resetCart();
  }, [loadCart, ready, resetCart, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchKeyword = params.get("keyword") || "";
    const categoryId = params.get("category") || "";
    const timer = window.setTimeout(() => {
      setKeyword(searchKeyword);
      setSelectedCategoryId(categoryId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.search]);

  const handleSignOut = async () => {
    await signOut();
    resetCart();
    navigate("/signin");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();
    const params = new URLSearchParams();
    if (trimmedKeyword) params.set("keyword", trimmedKeyword);
    if (selectedCategoryId) {
      params.set("category", selectedCategoryId);
      const selectedCategory = categories.find((category) => category._id === selectedCategoryId);
      if (selectedCategory) params.set("categoryName", selectedCategory.name);
    }
    navigate(params.size ? `/?${params.toString()}` : "/");
  };

  const selectCategory = (category?: Category) => {
    const categoryId = category?._id || "";
    setSelectedCategoryId(categoryId);
    setCategoryMenuOpen(false);
    const params = new URLSearchParams();
    if (category) {
      setKeyword("");
      params.set("category", category._id);
      params.set("categoryName", category.name);
    } else {
      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) params.set("keyword", trimmedKeyword);
    }
    navigate(params.size ? `/?${params.toString()}` : "/");
  };

  const selectedCategoryName = categories.find((category) => category._id === selectedCategoryId)?.name || "Tất cả danh mục";

  return (
    <div className="min-h-screen bg-[#f2f4f6] text-[#1e1e1e]">
      <header className="sticky top-0 z-30 bg-[#29324e] shadow-[0_2px_8px_rgba(41,50,78,0.18)]">
        <div className="bg-[#3278f6] text-white">
          <div className="mx-auto flex h-10 max-w-[1600px] items-center justify-between px-4 text-[13px] font-bold">
            <Link className="transition hover:text-[#fbff32]" to="/?all=1">Tất cả sản phẩm</Link>
            <div className="flex items-center divide-x divide-white/25">
              <a className="inline-flex items-center gap-2 px-4 transition hover:text-[#fbff32]" href={`tel:${siteSetting.phone.replace(/\s+/g, "")}`}>
                <Phone className="size-4" />
                {siteSetting.phone}
              </a>
              <a className="hidden items-center gap-2 px-4 transition hover:text-[#fbff32] sm:inline-flex" href={`mailto:${siteSetting.email}`}>
                <Mail className="size-4" />
                {siteSetting.email}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-[#29324e] text-white">
          <div className="mx-auto grid max-w-[1600px] grid-cols-[100px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:grid-cols-[145px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 sm:py-4">
            <Link to="/" className="grid h-11 w-[96px] -skew-x-12 place-items-center bg-white text-2xl font-black text-[#29324e] sm:h-14 sm:w-[135px] sm:text-4xl">
              <span className="skew-x-12">HNH</span>
            </Link>

            <form className="relative flex h-12 min-w-0 bg-white" onSubmit={handleSearch}>
              <div className="relative hidden w-[220px] shrink-0 lg:block">
                <button
                  aria-expanded={categoryMenuOpen}
                  className="flex h-full w-full items-center justify-between border-r border-[#d9d9d9] px-4 text-left text-sm font-bold text-[#29324e] transition hover:bg-[#f8faff]"
                  onClick={() => setCategoryMenuOpen((current) => !current)}
                  type="button"
                >
                  <span className="truncate">{selectedCategoryName}</span>
                  <ChevronDown className={`size-4 shrink-0 transition ${categoryMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-80 w-64 overflow-y-auto rounded-lg border border-[#dfe3eb] bg-white p-1.5 text-[#29324e] shadow-[0_14px_35px_rgba(16,24,40,0.18)]">
                    <button
                      className={`flex h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold transition hover:bg-[#eef4ff] hover:text-[#3278f6] ${!selectedCategoryId ? "bg-[#eef4ff] text-[#3278f6]" : ""}`}
                      onClick={() => selectCategory()}
                      type="button"
                    >
                      Tất cả danh mục
                    </button>
                    {categories.map((category) => (
                      <button
                        className={`flex h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold transition hover:bg-[#eef4ff] hover:text-[#3278f6] ${selectedCategoryId === category._id ? "bg-[#eef4ff] text-[#3278f6]" : ""}`}
                        key={category._id}
                        onClick={() => selectCategory(category)}
                        type="button"
                      >
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-[#29324e] outline-none placeholder:text-[#8d94ac]"
                placeholder="Nhập sản phẩm cần tìm..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button className="inline-flex w-14 shrink-0 items-center justify-center bg-[#3278f6] text-white transition hover:bg-[#2860c5] sm:w-36 sm:gap-2" type="submit" aria-label="Tìm kiếm">
                <span className="hidden text-sm font-bold sm:inline">Tìm kiếm</span>
                <Search className="size-5" />
              </button>
            </form>

            <div className="flex items-center">
              <div className="group/account relative hidden md:block">
                <Link
                  to={ready && user ? "/account" : "/signin"}
                  className="flex h-11 items-center gap-2 border-r border-white/30 px-4 text-sm font-bold text-white transition hover:text-[#fbff32] group-hover/account:text-[#fbff32]"
                >
                  <UserRound className="size-5" />
                  <span className="hidden max-w-32 truncate xl:inline">
                    {ready && user ? user.userName : "Tài khoản"}
                  </span>
                  <ChevronDown className="size-3.5 transition group-hover/account:rotate-180" />
                </Link>

                <div className={`invisible absolute right-0 top-full z-50 translate-y-2 pt-2 opacity-0 transition duration-200 group-hover/account:visible group-hover/account:translate-y-0 group-hover/account:opacity-100 ${ready && user ? "w-64" : "w-52"}`}>
                  <div className="overflow-hidden rounded-xl border border-[#eaecf0] bg-white text-[#344054] shadow-[0_18px_45px_rgba(16,24,40,0.16)]">
                    {!ready ? (
                      <div className="px-3 py-4 text-center text-sm text-[#8d94ac]">Đang tải tài khoản...</div>
                    ) : user ? (
                      <>
                        <div className="px-4 pb-2 pt-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#465fff] text-sm font-bold uppercase text-white">{user.userName.slice(0, 1)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#344054]">{user.userName}</p>
                              <p className="mt-0.5 truncate text-xs text-[#98a2b3]">{user.email}</p>
                            </div>
                            <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase ${user.role === "admin" ? "bg-[#ecf3ff] text-[#465fff]" : "bg-[#f2f4f7] text-[#667085]"}`}>
                              {user.role === "admin" ? "Admin" : "Thành viên"}
                            </span>
                          </div>
                        </div>
                        <div className="px-2.5 pb-2.5 pt-0">
                          <Link className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition hover:bg-[#f2f4f7] hover:text-[#465fff]" to="/account">
                            <CircleUserRound className="size-[18px] shrink-0 text-[#667085] transition group-hover:text-[#465fff]" strokeWidth={1.8} />
                            Thông tin tài khoản
                          </Link>
                          <Link className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition hover:bg-[#f2f4f7] hover:text-[#465fff]" to="/orders">
                            <ClipboardList className="size-[18px] shrink-0 text-[#667085] transition group-hover:text-[#465fff]" strokeWidth={1.8} />
                            Đơn hàng của tôi
                          </Link>
                          <Link className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition hover:bg-[#f2f4f7] hover:text-[#465fff]" to="/account#shipping-address">
                            <MapPinned className="size-[18px] shrink-0 text-[#667085] transition group-hover:text-[#465fff]" strokeWidth={1.8} />
                            Địa chỉ nhận hàng
                          </Link>
                          {user.role === "admin" ? (
                            <Link className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-[#465fff] transition hover:bg-[#f5f7ff]" to="/admin">
                              <LayoutGrid className="size-[18px] shrink-0" strokeWidth={1.8} />
                              Quản lý hệ thống
                              <ChevronRight className="ml-auto size-4" />
                            </Link>
                          ) : null}
                          <button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#d92d20] transition hover:bg-[#fef3f2]" onClick={() => void handleSignOut()} type="button">
                            <LogOut className="size-[18px] shrink-0" strokeWidth={1.8} />
                            Đăng xuất
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2">
                        <Link className="flex items-center gap-2.5 rounded-md bg-[#3278f6] px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#2860c5]" to="/signin">
                          <LogIn className="size-3.5" />
                          Đăng nhập
                        </Link>
                        <Link className="mt-1.5 flex items-center gap-2.5 rounded-md border border-[#d0d5dd] px-3 py-2 text-[13px] font-bold text-[#29324e] transition hover:border-[#3278f6] hover:text-[#3278f6]" to="/signup">
                          <UserPlus className="size-3.5" />
                          Đăng ký tài khoản
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Link
                aria-label={user ? "Thông tin tài khoản" : "Đăng nhập"}
                className="grid size-11 place-items-center border-r border-white/30 text-white md:hidden"
                to={user ? "/account" : "/signin"}
              >
                <UserRound className="size-5" />
              </Link>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative ml-1 inline-flex h-11 items-center gap-2 border border-white/20 px-2 text-sm font-bold transition sm:ml-3 sm:px-3 ${isActive ? "bg-[#3278f6] text-white" : "bg-white/5 text-white hover:bg-white/10"
                  }`
                }
              >
                <ShoppingCart className="size-5" />
                <span className="grid min-w-5 place-items-center bg-[#fb4e4e] px-1 text-[11px] text-white">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              </NavLink>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#29324e]">
          <nav className="mx-auto flex h-11 max-w-[1600px] items-center overflow-visible px-4">
            <div className="group relative hidden h-full shrink-0 items-center lg:flex">
              <button className="relative inline-flex h-full items-center gap-2 overflow-hidden px-4 text-sm font-bold uppercase text-white transition-all duration-300 after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 group-hover:bg-white/10 group-hover:text-white group-hover:after:scale-x-100" type="button">
                <Menu className="size-4" />
                Danh mục sản phẩm
                <ChevronDown className="size-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-[310px] translate-y-2 border border-[#dedede] bg-[#3e4b75] opacity-0 shadow-xl transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-3 border-b border-[#8d94ac]/45 px-4 py-2.5 text-left text-white transition last:border-0 hover:bg-white hover:text-[#29324e]"
                      onClick={() => navigate(`/?keyword=${encodeURIComponent(item.keyword)}`)}
                      type="button"
                    >
                      <Icon className="size-4 shrink-0 text-[#72a3ff]" />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">{item.label}</b>
                        <small className="block truncate text-[11px] font-semibold opacity-65">{item.helper}</small>
                      </span>
                      <ChevronRight className="size-4 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const [itemPath, itemSearch = ""] = item.to.split("?");
                const isActive =
                  location.pathname === itemPath &&
                  (itemSearch ? location.search === `?${itemSearch}` : true);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group/nav relative inline-flex h-11 shrink-0 items-center overflow-hidden px-3 text-[13px] font-bold text-white transition-all duration-300 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:-translate-y-px hover:bg-white/10 hover:text-white hover:after:scale-x-100 ${isActive ? "bg-white/10 text-white after:scale-x-100" : ""
                      }`}
                  >
                    <span className="relative transition-transform duration-300 group-hover/nav:-translate-y-px">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-3 py-0 text-left">
        <Outlet />
      </main>
      {location.pathname !== "/cart" && location.pathname !== "/build-pc" && location.pathname !== "/account" && location.pathname !== "/orders" && !location.pathname.startsWith("/products/") ? (
      <footer className="mt-8 bg-[#29324e] text-white">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div>
            <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold tracking-tight">
              {siteSetting.footerTitle}
            </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{siteSetting.footerDescription}</p>
              <div className="mt-5 space-y-3 text-sm text-white/70">
                <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#6fa0ff]" /><span>Showroom: {siteSetting.showroomAddress}</span></p>
                <a className="flex items-center gap-3 transition hover:text-white" href={`tel:${siteSetting.phone.replace(/\s+/g, "")}`}><Phone className="size-4 shrink-0 text-[#6fa0ff]" />{siteSetting.phone}</a>
                <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#6fa0ff]" /><span>Bảo hành: {siteSetting.warrantyAddress}</span></p>
                <a className="flex items-center gap-3 transition hover:text-white" href={`mailto:${siteSetting.email}`}><Mail className="size-4 shrink-0 text-[#6fa0ff]" />{siteSetting.email}</a>
              </div>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white">{group.title}</h2>
                <ul className="space-y-3 text-sm text-white/60">
                  {group.items.map((item) => (
                    <li key={item.label}>
                    <Link className="inline-flex items-center gap-2 transition hover:translate-x-1 hover:text-white" to={item.href}>
                      {item.label}
                    </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-[#242c45]">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
              <span>{siteSetting.copyright}</span>
              <span>PC Gaming · Laptop · Linh kiện máy tính · Gaming Gear</span>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
