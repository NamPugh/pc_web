import { AlertTriangle, ArrowRight, Check, CreditCard, LoaderCircle, ReceiptText, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router";

import { cartApi, getErrorMessage, paymentApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

type Result = { success: boolean; message: string };

const confettiColors = ["#3278f6", "#fb4e4e", "#fbbf24", "#22c55e", "#8b5cf6", "#06b6d4"];
const confettiPieces = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: ((index * 17) % 20) / 10,
  duration: 2.8 + ((index * 13) % 18) / 10,
  color: confettiColors[index % confettiColors.length],
  rotation: (index * 47) % 180,
  size: 6 + (index % 4) * 2,
}));

export default function VnPayReturnPage() {
  const [searchParams] = useSearchParams();
  const locallyCancelled = searchParams.get("cancelled") === "1";
  const pendingOrderId = searchParams.get("orderId") || sessionStorage.getItem("pendingVnPayOrder");
  const [result, setResult] = useState<Result | null>(() =>
    locallyCancelled
      ? { success: false, message: "Bạn đã rời khỏi cổng VNPay trước khi hoàn tất thanh toán." }
      : null
  );
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    sessionStorage.removeItem("pendingVnPayOrder");
    if (locallyCancelled) {
      if (pendingOrderId) void paymentApi.cancelVnPay(pendingOrderId);
      return;
    }

    let active = true;
    void paymentApi.vnPayReturn(searchParams)
      .then(({ data }) => {
        if (!active) return;
        setResult({ success: data.success, message: data.message });
        if (data.success) {
          void cartApi.get().then(({ data: cartData }) => {
            if (active) setCart(cartData.data);
          });
        }
      })
      .catch((error: unknown) => {
        if (active) setResult({ success: false, message: getErrorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [locallyCancelled, pendingOrderId, searchParams, setCart]);

  if (!result) {
    return <section className="grid min-h-[55vh] place-items-center py-8"><div className="text-center"><LoaderCircle className="mx-auto size-10 animate-spin text-[#3278f6]" /><p className="mt-4 font-bold text-[#475467]">Đang xác minh giao dịch VNPay...</p></div></section>;
  }

  const transactionNo = searchParams.get("vnp_TransactionNo");
  const amount = Number(searchParams.get("vnp_Amount") || 0) / 100;

  if (!result.success) {
    return (
      <section className="grid min-h-[68vh] place-items-center px-3 py-10 sm:px-6">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_24px_70px_rgba(41,50,78,0.13)] md:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[#29324e] p-7 text-white sm:p-9">
            <div className="absolute -right-16 -top-16 size-52 rounded-full bg-[#dc2626]/20 blur-2xl" />
            <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-[#3278f6]/20 blur-3xl" />
            <div className="relative">
              <span className="vnpay-result-icon grid size-28 place-items-center rounded-full border-[10px] border-white/10 bg-[#dc2626] text-white shadow-[0_14px_35px_rgba(220,38,38,0.32)] sm:size-32">
                <svg aria-hidden="true" className="size-14 sm:size-16" fill="none" viewBox="0 0 52 52">
                  <path className="vnpay-cross-path vnpay-cross-path-first" d="M16 16 36 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                  <path className="vnpay-cross-path vnpay-cross-path-second" d="M36 16 16 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                </svg>
              </span>
              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Giao dịch chưa hoàn tất</p>
              <h1 className="mt-2 text-3xl font-black leading-tight">Thanh toán thất bại</h1>
              <p className="mt-4 text-sm leading-6 text-white/65">Giao dịch VNPay chưa được ghi nhận. Bạn có thể quay lại giỏ hàng để thực hiện thanh toán lần nữa.</p>
            </div>
            <div className="relative mt-8 flex items-center gap-3 rounded-xl bg-white/[0.07] p-3 text-xs text-white/70">
              <ShoppingBag className="size-5 shrink-0 text-[#7da9ff]" />
              Sản phẩm trong giỏ hàng của bạn vẫn được giữ nguyên.
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9">
            <div className="flex items-start gap-3 rounded-xl border border-[#fed7d7] bg-[#fff6f6] p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#dc2626]" />
              <div>
                <p className="font-bold text-[#b42318]">Thanh toán chưa được xác nhận</p>
                <p className="mt-1 text-sm leading-6 text-[#667085]">{result.message}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#eaecf0] p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#3278f6]"><RefreshCw className="size-4" /></span>
                <div><p className="text-sm font-bold text-[#344054]">Thử thanh toán lại</p><p className="mt-0.5 text-xs text-[#98a2b3]">Quay về giỏ hàng và chọn lại phương thức thanh toán.</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#eaecf0] p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f2f4f7] text-[#667085]"><CreditCard className="size-4" /></span>
                <div><p className="text-sm font-bold text-[#344054]">Không phát sinh thanh toán</p><p className="mt-0.5 text-xs text-[#98a2b3]">Đơn hàng chỉ được ghi nhận thanh toán khi VNPay xác nhận thành công.</p></div>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button className="h-12 rounded-lg bg-[#3278f6] font-black hover:bg-[#2860c5]" asChild>
                <Link to="/cart"><ShoppingBag className="size-4" /> Quay lại giỏ hàng <ArrowRight className="size-4" /></Link>
              </Button>
              <Button className="h-12 rounded-lg border-[#d0d5dd] font-bold text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]" variant="outline" asChild>
                <Link to="/orders"><ReceiptText className="size-4" /> Xem đơn hàng</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative grid min-h-[68vh] place-items-center overflow-hidden py-8">
      {result.success ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiPieces.map((piece) => (
            <i
              className="vnpay-confetti"
              key={piece.id}
              style={{
                "--confetti-left": `${piece.left}%`,
                "--confetti-delay": `${piece.delay}s`,
                "--confetti-duration": `${piece.duration}s`,
                "--confetti-color": piece.color,
                "--confetti-rotation": `${piece.rotation}deg`,
                "--confetti-size": `${piece.size}px`,
              } as CSSProperties}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 w-full max-w-2xl border border-[#dfe5ee] bg-white shadow-[0_24px_70px_rgba(41,50,78,0.14)]">
        <div className={`h-2 w-full ${result.success ? "bg-gradient-to-r from-[#3278f6] via-[#22c55e] to-[#06b6d4]" : "bg-[#dc2626]"}`} />
        <div className="relative overflow-hidden px-5 py-8 text-center sm:px-10 sm:py-10">
          <div className={`pointer-events-none absolute left-1/2 top-12 size-44 -translate-x-1/2 rounded-full blur-3xl ${result.success ? "bg-[#3278f6]/15" : "bg-[#dc2626]/10"}`} />

          <div className="relative">
            {result.success ? <Sparkles className="absolute left-1/2 top-0 size-6 -translate-x-20 -translate-y-1 text-[#fbbf24]" /> : null}
            <span className="vnpay-result-icon mx-auto grid size-32 place-items-center rounded-full border-[12px] border-[#ecfdf3] bg-[#22c55e] text-white shadow-[0_14px_35px_rgba(34,197,94,0.3)] sm:size-36">
              <svg aria-hidden="true" className="size-16 sm:size-20" fill="none" viewBox="0 0 52 52">
                <path
                  className="vnpay-checkmark-path"
                  d="M14 27.5 22.5 36 39 18"
                  pathLength="1"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="5"
                />
              </svg>
            </span>
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-[#3278f6]">
            {result.success ? "Giao dịch hoàn tất" : "Giao dịch gián đoạn"}
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#29324e] sm:text-4xl">
            {result.success ? "Thanh toán thành công!" : "Thanh toán chưa thành công"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#667085]">
            {result.success ? "Cảm ơn bạn đã mua hàng. Đơn hàng đã được ghi nhận và đang chờ cửa hàng xử lý." : result.message}
          </p>

          {result.success ? (
            <div className="mx-auto mt-7 grid max-w-lg gap-px border border-[#e5e7eb] bg-[#e5e7eb] text-left sm:grid-cols-2">
              <div className="bg-[#f8fafc] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Trạng thái</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-[#15803d]"><Check className="size-4" /> Đã thanh toán</p>
              </div>
              <div className="bg-[#f8fafc] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Tổng thanh toán</p>
                <p className="mt-1 text-sm font-black text-[#29324e]">{amount.toLocaleString("vi-VN")} ₫</p>
              </div>
              {transactionNo ? (
                <div className="bg-[#f8fafc] p-4 sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Mã giao dịch VNPay</p>
                  <p className="mt-1 break-all text-sm font-black text-[#29324e]">{transactionNo}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto mt-6 max-w-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]">
              Bạn chưa bị ghi nhận thanh toán. Có thể quay lại giỏ hàng và thử lại.
            </div>
          )}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="h-12 rounded-none bg-[#3278f6] px-6 font-black hover:bg-[#2860c5]" asChild>
              <Link to="/orders"><ReceiptText className="size-4" /> Xem đơn hàng <ArrowRight className="size-4" /></Link>
            </Button>
            <Button className="h-12 rounded-none border-[#d0d5dd] px-6 font-bold text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]" variant="outline" asChild>
              <Link to={result.success ? "/" : "/cart"}><ShoppingBag className="size-4" /> {result.success ? "Tiếp tục mua hàng" : "Quay lại mua hàng"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
