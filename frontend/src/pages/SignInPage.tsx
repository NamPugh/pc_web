import { ArrowRight, Cpu, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

export default function SignInPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-[#111111] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle_at_top_left,white 0,transparent 35%),radial-gradient(circle_at_bottom_right,white 0,transparent 28%)" }} />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold tracking-tight">
              <span className="grid size-12 place-items-center rounded-md bg-white text-[#d71920] shadow-lg shadow-black/20">
                <Cpu className="size-6" />
              </span>
              PC Web
            </Link>
            <div className="mt-10 max-w-lg space-y-4">
              <p className="inline-flex rounded-md border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
                Gaming store experience
              </p>
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                Đăng nhập để tiếp tục build cấu hình và theo dõi đơn hàng.
              </h1>
              <p className="max-w-md text-sm leading-7 text-white/80">
                Giao diện auth được đồng bộ với homepage: đậm, tối, rõ điểm nhấn và hướng mua hàng.
              </p>
            </div>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-3">
            {[
              { icon: Sparkles, label: "Ưu đãi" },
              { icon: ShieldCheck, label: "Bảo mật" },
              { icon: ShoppingBag, label: "Mua nhanh" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <Icon className="size-5" />
                  <p className="mt-3 text-sm font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid size-11 place-items-center rounded-md bg-[#d71920] text-white shadow-lg shadow-red-200">
                <Cpu className="size-5" />
              </span>
              <div>
                <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-950">Đăng nhập</h1>
                <p className="text-sm text-slate-500">Theo dõi đơn hàng và giỏ hàng của bạn.</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d71920]">Tài khoản khách hàng</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Chào mừng trở lại</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập để tiếp tục mua linh kiện, kiểm tra đơn hàng và lưu cấu hình.</p>
            </div>
            <div className="mt-8 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 outline-none transition placeholder:text-slate-400 focus:border-[#d71920] focus:bg-white focus:ring-4 focus:ring-red-100"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Mật khẩu
                <input
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 outline-none transition placeholder:text-slate-400 focus:border-[#d71920] focus:bg-white focus:ring-4 focus:ring-red-100"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            </div>
            <Button className="mt-6 h-12 w-full rounded-md bg-[#d71920] text-white hover:bg-[#b80d18]" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-4 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <Link className="font-semibold text-[#d71920] hover:underline" to="/signup">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}