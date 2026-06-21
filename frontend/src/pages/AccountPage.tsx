import { ClipboardList, Cpu, LoaderCircle, LogIn, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, ShoppingCart, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const quickActions = [
  { label: "Đơn hàng", href: "/orders", icon: ClipboardList },
  { label: "Build PC", href: "/build-pc", icon: Cpu },
  { label: "Giỏ hàng", href: "/cart", icon: ShoppingCart },
];

export default function AccountPage() {
  const { user, ready, loadMe, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userName: "", email: "", phone: "", address: "" });

  useEffect(() => {
    if (!ready) void loadMe();
  }, [loadMe, ready]);

  const beginEditing = () => {
    if (!user) return;
    setForm({
      userName: user.userName,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    if (user) {
      setForm({
        userName: user.userName,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
      });
    }
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!form.userName.trim() || !form.email.trim()) {
      toast.warning("Vui lòng nhập tên người dùng và email");
      return;
    }

    setSaving(true);
    try {
      const { data } = await authApi.updateProfile({
        userName: form.userName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setUser(data.user);
      setForm({
        userName: data.user.userName,
        email: data.user.email,
        phone: data.user.phone || "",
        address: data.user.address || "",
      });
      setEditing(false);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return <div className="grid min-h-80 place-items-center border border-[#e5e7eb] bg-white"><div className="text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-[#3278f6]" /><p className="mt-3 text-sm font-semibold text-[#8d94ac]">Đang tải tài khoản...</p></div></div>;
  }

  if (!user) {
    return (
      <section className="grid gap-px border border-[#e5e7eb] bg-[#e5e7eb] lg:grid-cols-[1fr_0.8fr]">
        <div className="bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3278f6]">Tài khoản thành viên</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#29324e]">Đăng nhập để quản lý trải nghiệm mua hàng</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#667085]">
            Sau khi đăng nhập, bạn có thể xem đơn hàng, lưu cấu hình PC và thao tác giỏ hàng nhanh hơn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="h-11 rounded-none bg-[#3278f6] px-5 font-bold hover:bg-[#2860c5]" asChild>
              <Link to="/signin">
                <LogIn className="size-4" />
                Đăng nhập
              </Link>
            </Button>
            <Button className="h-11 rounded-none border-[#d0d5dd] font-bold text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]" variant="outline" asChild>
              <Link to="/signup">Tạo tài khoản</Link>
            </Button>
          </div>
        </div>
        <div className="bg-[#29324e] p-6 text-white sm:p-8">
          <span className="grid size-14 place-items-center bg-[#3278f6]"><ShieldCheck className="size-7" /></span>
          <h2 className="mt-5 text-2xl font-black tracking-tight">Quyền lợi thành viên</h2>
          <div className="mt-5 grid divide-y divide-white/10 border-y border-white/10 text-sm text-white/75">
            <p className="py-4">Lưu thông tin nhận hàng cho lần mua tiếp theo.</p>
            <p className="py-4">Theo dõi trạng thái đơn và lịch sử mua hàng.</p>
            <p className="py-4">Lưu cấu hình PC để thêm vào giỏ khi cần.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 py-5">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-[#29324e]">Thông tin tài khoản</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="bg-[#29324e] p-6 text-white sm:p-7">
            <div className="grid size-16 place-items-center rounded-xl bg-[#3278f6]">
              <UserRound className="size-9" />
            </div>
            <h2 className="mt-5 break-words text-2xl font-black">{user.userName}</h2>
            <p className="mt-2 break-all text-sm text-white/60">{user.email}</p>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#29324e]">Thông tin cá nhân</h2>
              </div>
              {!editing ? (
                <Button className="h-10 rounded-lg border-[#3278f6] px-4 text-[#3278f6] hover:bg-[#eef4ff]" onClick={beginEditing} variant="outline">
                  <Pencil className="size-4" /> Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button className="h-10 rounded-lg px-4" disabled={saving} onClick={cancelEditing} variant="outline"><X className="size-4" /> Hủy</Button>
                  <Button className="h-10 rounded-lg bg-[#3278f6] px-4 hover:bg-[#2860c5]" disabled={saving} onClick={() => void saveProfile()}>
                    {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Lưu
                  </Button>
                </div>
              )}
            </div>

            <div className="grid max-w-2xl gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Tên người dùng</span>
                <div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" /><input className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-3 text-sm font-semibold outline-none transition disabled:bg-[#f5f5f5] focus:border-[#3278f6] focus:ring-4 focus:ring-[#3278f6]/10" disabled={!editing} onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))} value={editing ? form.userName : user.userName} /></div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Email</span>
                <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" /><input className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-3 text-sm font-semibold outline-none transition disabled:bg-[#f5f5f5] focus:border-[#3278f6] focus:ring-4 focus:ring-[#3278f6]/10" disabled={!editing} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" value={editing ? form.email : user.email} /></div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Số điện thoại</span>
                <div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" /><input className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-3 text-sm font-semibold outline-none transition disabled:bg-[#f5f5f5] focus:border-[#3278f6] focus:ring-4 focus:ring-[#3278f6]/10" disabled={!editing} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Chưa cập nhật" value={editing ? form.phone : user.phone || ""} /></div>
              </label>
              <label className="scroll-mt-48" id="shipping-address">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Địa chỉ nhận hàng</span>
                <div className="relative"><MapPin className="absolute left-3 top-3.5 size-4 text-[#98a2b3]" /><textarea className="min-h-24 w-full resize-none rounded-lg border border-[#d0d5dd] bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none transition disabled:bg-[#f5f5f5] focus:border-[#3278f6] focus:ring-4 focus:ring-[#3278f6]/10" disabled={!editing} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Chưa cập nhật" value={editing ? form.address : user.address || ""} /></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href} className="group flex min-h-24 items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(41,50,78,0.1)]">
              <Icon className="size-8 shrink-0 text-[#465fff]" strokeWidth={1.8} />
              <h2 className="text-lg font-bold text-[#29324e] transition group-hover:text-[#465fff]">{item.label}</h2>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
