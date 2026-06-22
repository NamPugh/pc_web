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

const failureConfettiColors = ["#dc2626", "#ef4444", "#f97316", "#f59e0b", "#7f1d1d", "#fca5a5"];
const failureConfettiPieces = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: ((index * 17) % 20) / 10,
  duration: 2.8 + ((index * 13) % 18) / 10,
  color: failureConfettiColors[index % failureConfettiColors.length],
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
      <section className="relative grid min-h-[68vh] place-items-center overflow-hidden px-3 py-10 sm:px-6">
        {/* Failure Confetti particles */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {failureConfettiPieces.map((piece) => (
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

        <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_24px_70px_rgba(41,50,78,0.13)] md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#12131a] via-[#1a233d] to-[#3b0f11] p-7 text-white sm:p-9">
            <div className="absolute -right-16 -top-16 size-52 rounded-full bg-[#dc2626]/20 blur-2xl animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-[#f97316]/10 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
            
            <div className="relative">
              <svg aria-hidden="true" className="vnpay-result-icon size-24 sm:size-28 text-[#ef4444] filter drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" fill="none" viewBox="0 0 52 52">
                <path className="vnpay-cross-path vnpay-cross-path-first" d="M16 16 36 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                <path className="vnpay-cross-path vnpay-cross-path-second" d="M36 16 16 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
              </svg>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.25em] text-red-400/80">Giao dịch chưa hoàn tất</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-white tracking-wide">Thanh toán<br/>thất bại</h1>
              <p className="mt-4 text-sm leading-6 text-white/70">Yêu cầu giao dịch qua cổng VNPay chưa được hoàn tất hoặc bị gián đoạn. Bạn có thể quay lại giỏ hàng để thực hiện lại.</p>
            </div>
            
            <div className="relative mt-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 text-xs text-white/80 transition-all duration-300 hover:bg-white/[0.08]">
              <ShoppingBag className="size-5 shrink-0 text-red-400" />
              <span>Sản phẩm trong giỏ hàng của bạn vẫn được <strong>giữ nguyên vẹn</strong>.</span>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-9 bg-white">
            <div>
              {/* Alert banner */}
              <div className="flex items-start gap-3 rounded-xl border border-[#fed7d7] bg-[#fff6f6] p-4 shadow-[0_2px_12px_rgba(220,38,38,0.03)]">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#dc2626]" />
                <div>
                  <p className="font-bold text-[#b42318] text-sm sm:text-base">Thanh toán chưa được xác nhận</p>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#4f5b70]">{result.message}</p>
                </div>
              </div>

              {/* Transaction details table */}
              <div className="mt-6 rounded-xl border border-[#eaecf0] bg-white overflow-hidden shadow-sm">
                <div className="border-b border-[#eaecf0] bg-[#f8fafc] px-4 py-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475467]">Chi tiết giao dịch</h3>
                </div>
                <div className="divide-y divide-[#eaecf0]">
                  {amount > 0 && (
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-[#667085]">Số tiền thanh toán</span>
                      <span className="font-bold text-[#1d2939]">{amount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                  )}
                  {pendingOrderId && (
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-[#667085]">Mã đơn hàng</span>
                      <span className="font-bold text-[#1d2939]">{pendingOrderId}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-[#667085]">Phương thức</span>
                    <span className="font-bold text-[#3278f6]">Cổng thanh toán VNPay</span>
                  </div>
                </div>
              </div>

              {/* Guidance Options */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-[#eaecf0] bg-white p-3.5 transition-all duration-200 hover:border-[#3278f6]/40 hover:shadow-md group">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#3278f6] transition-transform duration-200 group-hover:scale-110">
                    <RefreshCw className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#344054] transition-colors duration-200 group-hover:text-[#3278f6]">Thử thanh toán lại</p>
                    <p className="mt-0.5 text-xs text-[#667085]">Quay về giỏ hàng và chọn lại phương thức thanh toán.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#eaecf0] bg-white p-3.5 transition-all duration-200 hover:border-[#667085]/40 hover:shadow-md group">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f2f4f7] text-[#667085] transition-transform duration-200 group-hover:scale-110">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#344054]">Không phát sinh thanh toán</p>
                    <p className="mt-0.5 text-xs text-[#667085]">Đơn hàng chỉ được ghi nhận thanh toán khi VNPay xác nhận thành công.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button className="h-12 rounded-lg bg-gradient-to-r from-[#dc2626] to-[#ea580c] hover:from-[#b91c1c] hover:to-[#d97706] text-white font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(220,38,38,0.2)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.3)] hover:-translate-y-0.5" asChild>
                <Link to="/cart">
                  <ShoppingBag className="size-4" /> Quay lại giỏ hàng <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button className="h-12 rounded-lg border-[#d0d5dd] font-bold text-[#344054] hover:border-[#dc2626] hover:text-[#dc2626] transition-all duration-200 bg-white shadow-sm" variant="outline" asChild>
                <Link to="/orders">
                  <ReceiptText className="size-4" /> Xem đơn hàng
                </Link>
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
