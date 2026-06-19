import { ArrowLeft, ArrowRight, Cpu, Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const benefits = [
  { icon: ShoppingCart, title: "Giỏ hàng đồng bộ", description: "Tiếp tục mua sắm trên mọi thiết bị." },
  { icon: PackageCheck, title: "Theo dõi đơn hàng", description: "Nắm rõ trạng thái xử lý và giao hàng." },
  { icon: ShieldCheck, title: "Tài khoản bảo mật", description: "Thông tin cá nhân được bảo vệ an toàn." },
];

export default function SignInPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.signIn({ email, password });
      setSession(data.accessToken);
      toast.success(data.message || "Đăng nhập thành công");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#29324e]">
      <header className="border-b border-[#dfe4eb] bg-white">
        <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid size-11 place-items-center bg-[#3278f6] text-white"><Cpu className="size-6" /></span>
            <div><strong className="block text-xl font-black tracking-tight">PC WEB</strong><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d94ac]">Gaming & Technology</span></div>
          </Link>
          <Link className="flex items-center gap-2 text-sm font-bold text-[#667085] transition hover:text-[#3278f6]" to="/">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-[1400px] items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#101828] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(50,120,246,0.32),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(14,165,233,0.2),transparent_30%)]" />
          <div className="absolute -right-24 top-24 size-80 rotate-45 border-[40px] border-[#3278f6]/10" />
          <div className="relative max-w-xl">
            <span className="inline-flex border border-[#5d8ff8] bg-[#3278f6]/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8db5ff]">Tài khoản khách hàng</span>
            <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight">Chào mừng bạn trở lại PC WEB.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">Đăng nhập để quản lý đơn hàng, lưu cấu hình PC và không bỏ lỡ những ưu đãi dành riêng cho thành viên.</p>
          </div>
          <div className="relative grid gap-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <article className="flex items-center gap-4 border border-white/10 bg-white/[0.04] p-4" key={item.title}>
                  <span className="grid size-11 shrink-0 place-items-center bg-[#3278f6]"><Icon className="size-5" /></span>
                  <div><h2 className="font-bold">{item.title}</h2><p className="mt-1 text-xs text-white/50">{item.description}</p></div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
          <form className="w-full max-w-md" onSubmit={onSubmit}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3278f6]">Đăng nhập tài khoản</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1d2939]">Tiếp tục mua sắm</h2>
            <p className="mt-2 text-sm leading-6 text-[#8d94ac]">Nhập thông tin tài khoản đã đăng ký tại PC WEB.</p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Địa chỉ email</span>
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="email" className="h-12 w-full border border-[#d0d5dd] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" required type="email" value={email} />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Mật khẩu</span>
                <span className="relative mt-2 block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="current-password" className="h-12 w-full border border-[#d0d5dd] bg-white pl-10 pr-11 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" required type={showPassword ? "text" : "password"} value={password} />
                  <button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-[#98a2b3] hover:text-[#3278f6]" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </span>
              </label>
            </div>

            <Button className="mt-7 h-12 w-full rounded-none bg-[#3278f6] font-bold hover:bg-[#2860c5]" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}<ArrowRight className="size-4" />
            </Button>

            <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-[#e5e7eb]" /><span className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Khách hàng mới</span><span className="h-px flex-1 bg-[#e5e7eb]" /></div>
            <Link className="flex h-12 items-center justify-center border border-[#3278f6] text-sm font-bold text-[#3278f6] transition hover:bg-[#eef4ff]" to="/signup">Tạo tài khoản PC WEB</Link>
          </form>
        </section>
      </div>
    </main>
  );
}
