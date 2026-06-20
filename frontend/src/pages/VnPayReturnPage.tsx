import { ArrowRight, Check, CheckCircle2, LoaderCircle, ReceiptText, ShoppingBag, Sparkles, XCircle } from "lucide-react";
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

  const Icon = result.success ? CheckCircle2 : XCircle;
  const transactionNo = searchParams.get("vnp_TransactionNo");
  const amount = Number(searchParams.get("vnp_Amount") || 0) / 100;

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
            <span className={`vnpay-result-icon mx-auto grid size-24 place-items-center rounded-full border-[10px] ${result.success ? "border-[#ecfdf3] bg-[#22c55e] text-white" : "border-[#fef2f2] bg-[#dc2626] text-white"}`}>
              <Icon className="size-11" strokeWidth={2.5} />
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
