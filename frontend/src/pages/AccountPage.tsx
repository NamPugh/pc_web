import { LogIn, Mail, MapPin, MonitorCog, PackageCheck, Phone, ShieldCheck, ShoppingCart, UserRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const quickActions = [
  { label: "Đơn hàng", description: "Theo dõi trạng thái và lịch sử mua hàng", href: "/orders", icon: PackageCheck },
  { label: "Build PC", description: "Tiếp tục chọn linh kiện cho cấu hình", href: "/build-pc", icon: MonitorCog },
  { label: "Giỏ hàng", description: "Rà soát sản phẩm trước khi thanh toán", href: "/cart", icon: ShoppingCart },
];

export default function AccountPage() {
  const { user, ready, loadMe } = useAuthStore();

  useEffect(() => {
    if (!ready) void loadMe();
  }, [loadMe, ready]);

  if (!ready) {
    return <div className="rounded-lg border border-[#ededed] bg-white p-8 text-center text-[#8d94ac] shadow-sm">Đang tải tài khoản...</div>;
  }

  if (!user) {
    return (
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-[#ededed] bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D91605]">Tài khoản</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#29324e]">Đăng nhập để quản lý trải nghiệm mua hàng</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#444]">
            Sau khi đăng nhập, bạn có thể xem đơn hàng, lưu cấu hình PC và thao tác giỏ hàng nhanh hơn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="h-11 rounded-md bg-[#D91605] px-5 hover:bg-[#b51204]" asChild>
              <Link to="/signin">
                <LogIn className="size-4" />
                Đăng nhập
              </Link>
            </Button>
            <Button className="h-11 rounded-md" variant="outline" asChild>
              <Link to="/signup">Tạo tài khoản</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-[#1e1e1e] p-6 text-white shadow-sm">
          <ShieldCheck className="size-8 text-white/80" />
          <h2 className="mt-5 text-2xl font-bold tracking-tight">Quyền lợi thành viên</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/80">
            <p className="rounded-md border border-white/15 bg-white/10 p-4">Lưu thông tin nhận hàng cho lần mua tiếp theo.</p>
            <p className="rounded-md border border-white/15 bg-white/10 p-4">Theo dõi trạng thái đơn và lịch sử mua hàng.</p>
            <p className="rounded-md border border-white/15 bg-white/10 p-4">Lưu cấu hình PC để thêm vào giỏ khi cần.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-[#ededed] bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#1e1e1e] p-6 text-white sm:p-8">
            <div className="grid size-20 place-items-center rounded-lg bg-white text-[#D91605] shadow-lg shadow-black/15">
              <UserRound className="size-10" />
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">Xin chào</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">{user.userName}</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/78">Khu vực quản lý nhanh thông tin cá nhân, đơn hàng và các cấu hình PC đã chọn.</p>
          </div>
          <div className="grid gap-4 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[#ededed] bg-[#f5f5f5] p-4">
                <Mail className="size-5 text-[#D91605]" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8d94ac]">Email</p>
                <p className="mt-1 truncate font-semibold text-[#29324e]">{user.email}</p>
              </div>
              <div className="rounded-md border border-[#ededed] bg-[#f5f5f5] p-4">
                <ShieldCheck className="size-5 text-[#D91605]" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8d94ac]">Vai trò</p>
                <p className="mt-1 font-semibold text-[#29324e]">{user.role === "admin" ? "Quản trị viên" : "Khách hàng"}</p>
              </div>
              <div className="rounded-md border border-[#ededed] bg-[#f5f5f5] p-4">
                <Phone className="size-5 text-[#D91605]" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8d94ac]">Số điện thoại</p>
                <p className="mt-1 font-semibold text-[#29324e]">{user.phone || "Chưa cập nhật"}</p>
              </div>
              <div className="scroll-mt-48 rounded-md border border-[#ededed] bg-[#f5f5f5] p-4" id="shipping-address">
                <MapPin className="size-5 text-[#D91605]" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8d94ac]">Địa chỉ</p>
                <p className="mt-1 line-clamp-1 font-semibold text-[#29324e]">{user.address || "Chưa cập nhật"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href} className="group rounded-lg border border-[#ededed] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#fb4e4e] hover:shadow-sm">
              <div className="grid size-12 place-items-center rounded-md bg-[#fff5f5] text-[#D91605] transition group-hover:bg-[#D91605] group-hover:text-white">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-[#29324e]">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-[#8d94ac]">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
