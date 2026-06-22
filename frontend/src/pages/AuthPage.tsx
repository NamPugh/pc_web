import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { authApi, getErrorMessage } from "@/api/client";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const fieldClassName =
  "h-12 w-full rounded-lg border border-white/15 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/30 hover:border-white/25 focus:border-[#dc2626] focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.14),0_0_24px_rgba(127,29,29,0.16)]";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const isSignUp = location.pathname === "/signup";

  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ userName: "", email: "", password: "" });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const submitSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.signIn(signIn);
      setSession(data.accessToken);
      toast.success(data.message || "Đăng nhập thành công");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.signUp(signUp);
      toast.success("Tạo tài khoản thành công");
      navigate("/signin");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/auth-background.png')" }}
      />

      <Link
        className="fixed right-4 top-4 z-30 flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-black/55 px-4 text-sm font-bold text-white/80 shadow-lg backdrop-blur-xl transition hover:border-[#dc2626]/60 hover:text-white sm:right-6 sm:top-6"
        to="/"
      >
        <ArrowLeft className="size-4" />
        Về trang chủ
      </Link>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-12">
        <section
          className="relative min-h-[610px] w-full max-w-[1440px] overflow-hidden rounded-2xl border border-white/10 bg-black bg-cover bg-center bg-no-repeat shadow-[0_35px_100px_rgba(0,0,0,0.75)] lg:aspect-[16/9] lg:min-h-0"
          style={{ backgroundImage: "url('/auth-background.png')" }}
        >
          <div
            className={`relative flex min-h-[610px] w-full items-center overflow-hidden border-white/10 bg-[linear-gradient(145deg,rgba(16,16,18,0.96),rgba(3,3,5,0.93))] px-5 py-10 shadow-[0_0_70px_rgba(0,0,0,0.72)] transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:-right-28 before:-top-28 before:size-72 before:rounded-full before:bg-[#991b1b]/10 before:blur-3xl after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gradient-to-r after:from-transparent after:via-[#dc2626]/70 after:to-transparent sm:px-10 lg:absolute lg:inset-y-0 lg:w-[42%] lg:border-x lg:px-14 ${
              isSignUp ? "lg:left-[58%]" : "lg:left-0"
            }`}
          >
            <div className="w-full">
              <nav className="mb-8 grid grid-cols-2 rounded-lg border border-white/15 bg-white/[0.05] p-1">
                <Link
                  className={`flex h-10 items-center justify-center rounded-md text-sm font-bold transition ${
                    isSignUp
                      ? "text-white/45 hover:bg-white/[0.06] hover:text-white"
                      : "bg-[#991b1b] text-white shadow-[0_6px_18px_rgba(127,29,29,0.35)]"
                  }`}
                  to="/signin"
                >
                  Đăng nhập
                </Link>
                <Link
                  className={`flex h-10 items-center justify-center rounded-md text-sm font-bold transition ${
                    isSignUp
                      ? "bg-[#991b1b] text-white shadow-[0_6px_18px_rgba(127,29,29,0.35)]"
                      : "text-white/45 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  to="/signup"
                >
                  Đăng ký
                </Link>
              </nav>

              <div
                className={`transition-all duration-300 ${
                  isSignUp ? "translate-y-0 opacity-100" : "pointer-events-none absolute translate-y-3 opacity-0"
                }`}
              >
                <SignUpForm
                  form={signUp}
                  loading={loading}
                  onChange={setSignUp}
                  onGoogleSignIn={submitGoogleSignIn}
                  onSubmit={submitSignUp}
                  onTogglePassword={() => setShowSignUpPassword((current) => !current)}
                  showPassword={showSignUpPassword}
                />
              </div>

              <div
                className={`transition-all duration-300 ${
                  isSignUp ? "pointer-events-none absolute translate-y-3 opacity-0" : "translate-y-0 opacity-100"
                }`}
              >
                <SignInForm
                  form={signIn}
                  loading={loading}
                  onChange={setSignIn}
                  onGoogleSignIn={submitGoogleSignIn}
                  onSubmit={submitSignIn}
                  onTogglePassword={() => setShowSignInPassword((current) => !current)}
                  showPassword={showSignInPassword}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type SignInFormProps = {
  form: { email: string; password: string };
  loading: boolean;
  showPassword: boolean;
  onChange: (form: { email: string; password: string }) => void;
  onGoogleSignIn: (credential: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function SignInForm({ form, loading, showPassword, onChange, onGoogleSignIn, onTogglePassword, onSubmit }: SignInFormProps) {
  return (
    <form className="mx-auto w-full max-w-md" onSubmit={onSubmit}>
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#ef4444]">HNH Member</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Đăng nhập</h1>
      <p className="mt-2 text-sm leading-6 text-white/45">Chào mừng bạn quay trở lại.</p>

      <div className="mt-8 space-y-4">
        <AuthField icon={Mail} label="Địa chỉ email">
          <input
            autoComplete="email"
            className={fieldClassName}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            placeholder="email@example.com"
            required
            type="email"
            value={form.email}
          />
        </AuthField>
        <AuthField icon={LockKeyhole} label="Mật khẩu">
          <input
            autoComplete="current-password"
            className={`${fieldClassName} pr-11`}
            onChange={(event) => onChange({ ...form, password: event.target.value })}
            placeholder="Nhập mật khẩu"
            required
            type={showPassword ? "text" : "password"}
            value={form.password}
          />
          <PasswordToggle onClick={onTogglePassword} showPassword={showPassword} />
        </AuthField>
      </div>

      <Button className="mt-7 h-12 w-full rounded-lg border border-[#ef4444]/30 bg-gradient-to-r from-[#7f1d1d] to-[#b91c1c] font-bold text-white shadow-[0_10px_30px_rgba(127,29,29,0.28)] transition hover:from-[#991b1b] hover:to-[#dc2626]" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        <ArrowRight className="size-4" />
      </Button>

      <AuthDivider />
      <GoogleSignInButton onCredential={onGoogleSignIn} />
    </form>
  );
}

type SignUpFormProps = {
  form: { userName: string; email: string; password: string };
  loading: boolean;
  showPassword: boolean;
  onChange: (form: { userName: string; email: string; password: string }) => void;
  onGoogleSignIn: (credential: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function SignUpForm({ form, loading, showPassword, onChange, onGoogleSignIn, onTogglePassword, onSubmit }: SignUpFormProps) {
  return (
    <form className="mx-auto w-full max-w-md" onSubmit={onSubmit}>
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#ef4444]">HNH Member</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Tạo tài khoản</h1>
      <p className="mt-2 text-sm leading-6 text-white/45">Đăng ký để bắt đầu mua sắm và lưu cấu hình PC.</p>

      <div className="mt-7 space-y-4">
        <AuthField icon={UserRound} label="Tên người dùng">
          <input
            autoComplete="name"
            className={fieldClassName}
            onChange={(event) => onChange({ ...form, userName: event.target.value })}
            placeholder="Tên hiển thị của bạn"
            required
            value={form.userName}
          />
        </AuthField>
        <AuthField icon={Mail} label="Địa chỉ email">
          <input
            autoComplete="email"
            className={fieldClassName}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            placeholder="email@example.com"
            required
            type="email"
            value={form.email}
          />
        </AuthField>
        <AuthField icon={LockKeyhole} label="Mật khẩu">
          <input
            autoComplete="new-password"
            className={`${fieldClassName} pr-11`}
            minLength={6}
            onChange={(event) => onChange({ ...form, password: event.target.value })}
            placeholder="Tối thiểu 6 ký tự"
            required
            type={showPassword ? "text" : "password"}
            value={form.password}
          />
          <PasswordToggle onClick={onTogglePassword} showPassword={showPassword} />
        </AuthField>
      </div>

      <Button className="mt-7 h-12 w-full rounded-lg border border-[#ef4444]/30 bg-gradient-to-r from-[#7f1d1d] to-[#b91c1c] font-bold text-white shadow-[0_10px_30px_rgba(127,29,29,0.28)] transition hover:from-[#991b1b] hover:to-[#dc2626]" disabled={loading}>
        {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        <ArrowRight className="size-4" />
      </Button>

      <AuthDivider />
      <GoogleSignInButton onCredential={onGoogleSignIn} />
    </form>
  );
}

type AuthFieldProps = {
  icon: typeof Mail;
  label: string;
  children: ReactNode;
};

function AuthField({ icon: Icon, label, children }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/75">{label}</span>
      <span className="relative mt-2 block">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-white/35" />
        {children}
      </span>
    </label>
  );
}

type PasswordToggleProps = {
  showPassword: boolean;
  onClick: () => void;
};

function PasswordToggle({ showPassword, onClick }: PasswordToggleProps) {
  return (
    <button
      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-white/35 transition hover:text-[#ef4444]"
      onClick={onClick}
      type="button"
    >
      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Hoặc tiếp tục với</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
