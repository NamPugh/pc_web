import { ArrowLeft, ArrowRight, BadgePercent, Cpu, Eye, EyeOff, LockKeyhole, Mail, MonitorCog, PackageCheck, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: MonitorCog, title: "Lưu cấu hình PC", description: "Quản lý và sử dụng lại những bộ máy đã build." },
  { icon: BadgePercent, title: "Ưu đãi thành viên", description: "Nhận thông tin deal và chương trình khuyến mãi." },
  { icon: PackageCheck, title: "Quản lý đơn hàng", description: "Theo dõi lịch sử mua sắm trong một tài khoản." },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.signUp(form);
      toast.success("Tạo tài khoản thành công");
      navigate("/signin");
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

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-[1400px] items-stretch lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
          <form className="w-full max-w-md" onSubmit={onSubmit}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3278f6]">Đăng ký thành viên</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1d2939]">Tạo tài khoản PC WEB</h1>
            <p className="mt-2 text-sm leading-6 text-[#8d94ac]">Chỉ mất một phút để bắt đầu trải nghiệm mua sắm thuận tiện hơn.</p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Tên người dùng</span>
                <span className="relative mt-2 block">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="name" className="h-12 w-full border border-[#d0d5dd] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setForm({ ...form, userName: event.target.value })} placeholder="Tên hiển thị của bạn" required value={form.userName} />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Địa chỉ email</span>
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="email" className="h-12 w-full border border-[#d0d5dd] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@example.com" required type="email" value={form.email} />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#344054]">Mật khẩu</span>
                <span className="relative mt-2 block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                  <input autoComplete="new-password" className="h-12 w-full border border-[#d0d5dd] bg-white pl-10 pr-11 text-sm outline-none transition placeholder:text-[#b0b6c3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.12)]" minLength={6} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Tối thiểu 6 ký tự" required type={showPassword ? "text" : "password"} value={form.password} />
                  <button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-[#98a2b3] hover:text-[#3278f6]" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </span>
                <span className="mt-2 block text-xs text-[#98a2b3]">Sử dụng ít nhất 6 ký tự để bảo vệ tài khoản.</span>
              </label>
            </div>

            <Button className="mt-7 h-12 w-full rounded-none bg-[#3278f6] font-bold hover:bg-[#2860c5]" disabled={loading}>
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}<ArrowRight className="size-4" />
            </Button>
            <p className="mt-6 text-center text-sm text-[#667085]">Đã là thành viên? <Link className="font-bold text-[#3278f6] hover:underline" to="/signin">Đăng nhập ngay</Link></p>
          </form>
        </section>

        <section className="relative hidden overflow-hidden bg-[#101828] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(50,120,246,0.34),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.2),transparent_30%)]" />
          <div className="absolute -left-20 bottom-24 size-72 rotate-45 border-[36px] border-[#3278f6]/10" />
          <div className="relative max-w-xl">
            <span className="inline-flex border border-[#5d8ff8] bg-[#3278f6]/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8db5ff]">PC WEB Member</span>
            <h2 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight">Một tài khoản cho toàn bộ trải nghiệm công nghệ.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">Lưu sản phẩm yêu thích, quản lý đơn hàng và xây dựng bộ PC phù hợp với nhu cầu của riêng bạn.</p>
          </div>
          <div className="relative grid gap-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <article className="flex items-center gap-4 border border-white/10 bg-white/[0.04] p-4" key={item.title}>
                  <span className="grid size-11 shrink-0 place-items-center bg-[#3278f6]"><Icon className="size-5" /></span>
                  <div><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-white/50">{item.description}</p></div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
