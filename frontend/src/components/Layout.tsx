import { Boxes, ChevronDown, Headphones, LifeBuoy, Mail, MapPin, MonitorCog, Newspaper, Search, ShieldCheck, ShoppingCart, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { to: "/build-pc", label: "Xây dựng cấu hình PC", icon: MonitorCog },
  { to: "/?keyword=PC%20Gaming", label: "PC Gaming", icon: Boxes },
  { to: "/?keyword=PC%20%C4%90%E1%BB%93%20H%E1%BB%8Da%20AI", label: "PC Đồ Họa AI", icon: Boxes },
  { to: "/?keyword=Laptop%20Gaming", label: "Laptop Gaming", icon: Search },
  { to: "/?keyword=M%C3%A0n%20h%C3%ACnh%20gaming", label: "Màn hình gaming", icon: Search },
  { to: "/?keyword=RTX%205070", label: "RTX 5070", icon: ShieldCheck },
  { to: "/news", label: "Tin tức", icon: Newspaper },
  { to: "/support", label: "Hỗ trợ", icon: LifeBuoy },
];

const quickKeywords = ["Build PC", "PC gaming", "PC đồ họa AI", "Màn hình gaming", "Laptop Gaming", "PS5 Slim", "RTX 5060", "RTX 5070", "RTX 5080", "RX 9070", "Máy in"];

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
      { label: "Tin Tức", href: "/news" },
      { label: "Tài khoản", href: "/account" },
      { label: "Liên Hệ", href: "/support" },
      { label: "Ý Kiến Khách Hàng", href: "/support" },
    ],
  },
  {
    title: "Chính Sách",
    items: [
      { label: "Vận Chuyển", href: "/support" },
      { label: "Bảo Hành", href: "/support" },
      { label: "Đổi Trả", href: "/support" },
      { label: "Quy Định Chung", href: "/support" },
    ],
  },
  {
    title: "Hỗ Trợ Nhanh",
    items: [
      { label: "Build PC", href: "/build-pc" },
      { label: "Tư Vấn Cấu Hình", href: "/support" },
      { label: "Theo Dõi Đơn Hàng", href: "/orders" },
      { label: "Thanh Toán", href: "/cart" },
      { label: "Câu Hỏi Thường Gặp", href: "/support" },
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, ready, loadMe, signOut } = useAuthStore();
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();
    navigate(trimmedKeyword ? `/?keyword=${encodeURIComponent(trimmedKeyword)}` : "/");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white text-[#333333]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-1.5 text-[12px] font-semibold">
            <div className="flex flex-wrap items-center gap-4">
              <Link className="font-bold text-[#d71920] hover:underline" to="/">
                Tất cả sản phẩm
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="size-3.5" />
                0911111111
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                cskh@pcweb.local
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                114 Chiến Thắng, Hà Nội
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <ShieldCheck className="size-3.5" />
                Hàng chính hãng, giá tốt
              </span>
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <Link className="transition hover:text-[#d71920]" to="/support">Liên hệ</Link>
              <Link className="transition hover:text-[#d71920]" to="/orders">Tra cứu đơn hàng</Link>
              <Link className="transition hover:text-[#d71920]" to="/news">Tin công nghệ</Link>
            </div>
          </div>
        </div>
        <div className="bg-white text-slate-950">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <span className="grid h-12 w-[74px] place-items-center rounded bg-[#d71920] text-2xl font-bold text-white">PC</span>
              <span className="hidden leading-none md:block">
                PC Web
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d71920]">Gaming store</span>
              </span>
            </Link>
            <Link to="/" className="hidden h-10 shrink-0 items-center gap-2 rounded bg-[#d71920] px-4 text-sm font-bold text-white transition hover:bg-[#b80d18] lg:inline-flex">
              <Boxes className="size-4" />
              Tất cả danh mục
              <ChevronDown className="size-4" />
            </Link>
            <form className="order-last flex h-10 w-full flex-1 rounded border-2 border-[#d71920] bg-white lg:order-none lg:min-w-[380px]" onSubmit={handleSearch}>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Tìm PC gaming, ps5, rtx 5070, laptop gaming..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button className="inline-flex w-12 items-center justify-center bg-[#d71920] text-white transition hover:bg-[#b80d18]" type="submit" aria-label="Tìm kiếm">
                <Search className="size-4" />
              </button>
            </form>
            <div className="ml-auto flex items-center gap-2">
              {ready && user ? (
                <>
                  <Link to="/account" className="hidden h-10 items-center gap-2 rounded bg-slate-100 px-3 text-sm font-bold text-slate-800 transition hover:bg-red-50 hover:text-[#d71920] sm:inline-flex">
                    <UserRound className="size-4" />
                    Tài khoản
                  </Link>
                  <Button className="rounded bg-[#111] px-4 text-white hover:bg-black" onClick={handleSignOut}>
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Button className="rounded bg-slate-100 px-4 text-slate-900 hover:bg-red-50 hover:text-[#d71920]" asChild>
                    <Link to="/signin"><UserRound className="size-4" /> Tài khoản</Link>
                  </Button>
                  <Button className="hidden rounded bg-[#111] px-4 text-white hover:bg-black sm:inline-flex" asChild>
                    <Link to="/signup">Đăng ký</Link>
                  </Button>
                </>
              )}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative inline-flex h-10 items-center gap-2 rounded px-3 text-sm font-bold transition ${
                    isActive ? "bg-[#d71920] text-white" : "bg-slate-100 text-slate-800 hover:bg-red-50 hover:text-[#d71920]"
                  }`
                }
              >
                <ShoppingCart className="size-4" />
                Giỏ hàng
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#d71920] text-[11px] text-white">0</span>
              </NavLink>
            </div>
          </div>
        </div>
        <div className="border-y border-slate-200 bg-[#f7f7f7]">
          <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
            {navItems.map((item) => {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex h-9 shrink-0 items-center gap-2 rounded px-3 text-sm font-bold transition ${
                      isActive ? "bg-[#d71920] text-white" : "text-slate-700 hover:bg-white hover:text-[#d71920]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
            {user?.role === "admin" ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `inline-flex h-9 shrink-0 items-center rounded px-3 text-sm font-bold transition ${
                    isActive ? "bg-[#d71920] text-white" : "text-slate-700 hover:bg-white hover:text-[#d71920]"
                  }`
                }
              >
                Admin
              </NavLink>
            ) : null}
          </nav>
        </div>
        <div className="hidden border-b border-slate-200 bg-white md:block">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em]">
            {quickKeywords.map((item) => (
              <Link key={item} to={`/?keyword=${encodeURIComponent(item)}`} className="shrink-0 px-2 py-1 text-slate-700 transition hover:text-[#d71920]">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-4 text-left">
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-slate-800 bg-[#111111] text-white">
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Đăng ký email để nhận tin khuyến mãi</h2>
              <p className="mt-1 text-sm text-white/60">Nhận deal PC gaming, VGA, laptop và gaming gear mới nhất.</p>
            </div>
            <form className="flex w-full max-w-md overflow-hidden rounded bg-white">
              <input className="min-w-0 flex-1 px-4 text-sm text-slate-900 outline-none" placeholder="Email của bạn" />
              <button className="bg-[#d71920] px-5 text-sm font-bold text-white">Đăng ký</button>
            </form>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold tracking-tight">
              <span className="grid size-11 place-items-center rounded bg-[#d71920] text-white">PC</span>
              PC Web
            </Link>
            <p className="max-w-sm text-sm leading-6 text-white/70">
              Cửa hàng linh kiện PC với danh mục nhanh, deal nổi bật, build cấu hình và khu vực sản phẩm rõ ràng.
            </p>
            <div className="space-y-1 text-sm text-white/70">
              <p>Showroom: 114 Chiến Thắng, Hà Nội</p>
              <p>Tel: 086 830 2123</p>
              <p>Trung tâm bảo hành: 114 Chiến Thắng, Hà Nội</p>
              <p>Email: cskh@pcweb.local</p>
            </div>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-white">{group.title}</h2>
              <ul className="space-y-3 text-sm text-white/70">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link className="transition hover:text-white" to={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 PC Web</span>
            <span>PC gaming · PS5 Slim · RTX 5070 · Laptop gaming · Ghế gaming</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
