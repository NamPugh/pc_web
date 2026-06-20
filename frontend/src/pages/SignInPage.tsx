import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, ShoppingCart } from "lucide-react";
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
    <main className="min-h-screen bg-[#f3f5f8] text-[#29324e]">
      <Link className="fixed right-4 top-4 z-20 flex h-10 items-center gap-2 rounded-lg border border-[#dfe4eb] bg-white px-4 text-sm font-bold text-[#667085] shadow-sm transition hover:border-[#3278f6] hover:text-[#3278f6] sm:right-6 sm:top-6" to="/">
        <ArrowLeft className="size-4" /> Về trang chủ
      </Link>

      <div className="mx-auto flex min-h-screen max-w-[1280px] items-center justify-center px-4 py-20 sm:px-6 lg:py-12">
        <div className="grid w-full max-w-[1040px] overflow-hidden rounded-2xl border border-[#e2e7ee] bg-white shadow-[0_20px_55px_rgba(41,50,78,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-[#29324e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(50,120,246,0.38),transparent_38%),radial-gradient(circle_at_90%_90%,rgba(50,120,246,0.18),transparent_35%)]" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Tài khoản khách hàng</span>
              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight">Chào mừng bạn trở lại.</h1>
              <p className="mt-4 text-sm leading-6 text-white/60">Quản lý đơn hàng và trải nghiệm mua sắm thuận tiện hơn cùng PC WEB.</p>
            </div>
            <div className="relative mt-10 space-y-3">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="flex items-center gap-3 rounded-xl bg-white/[0.07] p-3" key={item.title}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#3278f6]"><Icon className="size-4" /></span>
                    <div><h2 className="text-sm font-bold">{item.title}</h2><p className="mt-0.5 text-[11px] text-white/50">{item.description}</p></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="flex items-center justify-center px-5 py-9 sm:px-10 lg:px-14">
            <form className="w-full max-w-md" onSubmit={onSubmit}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3278f6]">Đăng nhập tài khoản</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1d2939]">Đăng nhập</h2>
              <p className="mt-2 text-sm leading-6 text-[#8d94ac]">Nhập thông tin tài khoản của bạn để tiếp tục.</p>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Địa chỉ email</span>
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="email" className="h-12 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" required type="email" value={email} />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Mật khẩu</span>
                <span className="relative mt-2 block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="current-password" className="h-12 w-full rounded-lg border border-[#d0d5dd] bg-white pl-10 pr-11 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" required type={showPassword ? "text" : "password"} value={password} />
                  <button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-[#98a2b3] hover:text-[#3278f6]" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </span>
              </label>
            </div>

            <Button className="mt-6 h-12 w-full rounded-lg bg-[#3278f6] font-bold hover:bg-[#2860c5]" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}<ArrowRight className="size-4" />
            </Button>

              <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#e5e7eb]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#98a2b3]">Chưa có tài khoản?</span><span className="h-px flex-1 bg-[#e5e7eb]" /></div>
              <Link className="flex h-12 items-center justify-center rounded-lg border border-[#3278f6] text-sm font-bold text-[#3278f6] transition hover:bg-[#eef4ff]" to="/signup">Đăng ký tài khoản</Link>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
