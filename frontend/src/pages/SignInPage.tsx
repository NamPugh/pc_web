import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const inputClassName =
  "h-[52px] w-full rounded-lg border border-[#d0d5dd] bg-white pl-12 pr-4 text-[15px] text-[#29324e] outline-none transition placeholder:text-[#98a2b3] hover:border-[#98a2b3] focus:border-[#3278f6] focus:shadow-[0_0_0_3px_rgba(50,120,246,0.13)]";

export default function SignInPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.signIn(form);
      setSession(data.accessToken);
      toast.success(data.message || "Đăng nhập thành công");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleSignIn = async (credential: string) => {
    setLoading(true);
    try {
      const { data } = await authApi.googleSignIn(credential);
      setSession(data.accessToken);
      toast.success(data.message || "Đăng nhập Google thành công");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f2f4f7] px-4 py-20 text-[#29324e] sm:px-6">
      <Link
        className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-lg border border-[#dfe3eb] bg-white px-4 text-sm font-bold text-[#667085] shadow-sm transition hover:border-[#3278f6] hover:text-[#3278f6] sm:right-6 sm:top-6"
        to="/"
      >
        <ArrowLeft className="size-4" />
        Về trang chủ
      </Link>

      <section className="w-full max-w-[480px] rounded-2xl border border-[#dfe3eb] bg-white px-6 py-9 shadow-[0_20px_55px_rgba(41,50,78,0.12)] sm:px-10 sm:py-10">
        <form onSubmit={submitSignIn}>
          <h1 className="text-[34px] font-black tracking-tight text-[#1d2939]">Đăng nhập</h1>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Địa chỉ email</span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  autoComplete="email"
                  className={inputClassName}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="email@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Mật khẩu</span>
              <span className="relative mt-2 block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  autoComplete="current-password"
                  className={`${inputClassName} pr-12`}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Nhập mật khẩu"
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                />
                <button
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-[#98a2b3] transition hover:text-[#3278f6]"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
          </div>

          <Button
            className="mt-7 h-[52px] w-full rounded-lg bg-[#3278f6] text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(50,120,246,0.2)] hover:bg-[#2860c5]"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            <ArrowRight className="size-4" />
          </Button>

          <AuthDivider />
          <GoogleSignInButton onCredential={submitGoogleSignIn} />

          <p className="mt-6 text-center text-sm text-[#667085]">
            Chưa có tài khoản?{" "}
            <Link className="font-bold text-[#3278f6] hover:underline" to="/signup">
              Đăng ký tài khoản
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#e4e7ec]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">Hoặc tiếp tục với</span>
      <span className="h-px flex-1 bg-[#e4e7ec]" />
    </div>
  );
}
