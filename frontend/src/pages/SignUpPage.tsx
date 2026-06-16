import { ArrowRight, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: "", email: "", password: "" });
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
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={onSubmit} className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-md bg-[#d71920] text-white shadow-lg shadow-red-200">
                <Cpu className="size-5" />
              </span>
              <div>
                <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-950">Tạo tài khoản</h1>
                <p className="text-sm text-slate-500">Bắt đầu mua linh kiện và lưu cấu hình PC.</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Tên người dùng
                <input
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 outline-none transition placeholder:text-slate-400 focus:border-[#d71920] focus:bg-white focus:ring-4 focus:ring-red-100"
                  value={form.userName}
                  onChange={(event) => setForm({ ...form, userName: event.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 outline-none transition placeholder:text-slate-400 focus:border-[#d71920] focus:bg-white focus:ring-4 focus:ring-red-100"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Mật khẩu
                <input
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 outline-none transition placeholder:text-slate-400 focus:border-[#d71920] focus:bg-white focus:ring-4 focus:ring-red-100"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </label>
            </div>
            <Button className="mt-6 h-12 w-full rounded-md bg-[#d71920] text-white hover:bg-[#b80d18]" disabled={loading}>
              {loading ? "Đang tạo..." : "Đăng ký"}
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-4 text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link className="font-semibold text-[#d71920] hover:underline" to="/signin">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>

        <div className="relative hidden overflow-hidden bg-[#111111] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle_at_top_right,white 0,transparent 30%),radial-gradient(circle_at_bottom_left,white 0,transparent 24%)" }} />
          <div className="relative">
            <p className="inline-flex rounded-md border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
              PC gaming experience
            </p>
            <h2 className="mt-6 max-w-lg text-5xl font-bold leading-tight tracking-tight">
              Tạo tài khoản để lưu cấu hình và nhận khuyến mãi.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">
              Tông đỏ - đen đậm, hình khối rõ ràng và bố cục thương mại giống trang cửa hàng công nghệ lớn.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Lưu giỏ hàng đồng bộ",
              "Theo dõi đơn nhanh",
              "Gợi ý build PC",
              "Ưu đãi thành viên",
            ].map((item) => (
              <div key={item} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                <Sparkles className="size-5" />
                <p className="mt-3 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
