import { AlertTriangle, ArrowRight, Check, CreditCard, LoaderCircle, ReceiptText, ShoppingBag } from "lucide-react";
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
  delay: ((index * 17) % 36) / 10,
  duration: 5 + ((index * 13) % 24) / 10,
  color: confettiColors[index % confettiColors.length],
  rotation: (index * 47) % 180,
  size: 6 + (index % 4) * 2,
}));

const failureConfettiColors = ["#dc2626", "#ef4444", "#f97316", "#f59e0b", "#7f1d1d", "#fca5a5"];
const failureConfettiPieces = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: ((index * 17) % 36) / 10,
  duration: 5 + ((index * 13) % 24) / 10,
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
      <section className="relative grid min-h-[68vh] place-items-center overflow-hidden bg-[#f2f4f7] px-4 py-10 sm:px-6">
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

        <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_20px_55px_rgba(16,24,40,0.1)]">
          <div className="border-b border-[#e4e7ec] px-6 py-8 text-center sm:px-10">
            <span className="vnpay-result-icon mx-auto grid size-32 place-items-center text-[#f04438]">
              <svg aria-hidden="true" className="size-24" fill="none" viewBox="0 0 52 52">
                <path className="vnpay-cross-path vnpay-cross-path-first" d="M16 16 36 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                <path className="vnpay-cross-path vnpay-cross-path-second" d="M36 16 16 36" pathLength="1" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
              </svg>
            </span>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-[#101828] sm:text-4xl">Thanh toán thất bại</h1>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-start gap-3 rounded-xl border border-[#fecdca] bg-[#fef3f2] p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#f04438]" />
              <div>
                <p className="text-sm font-bold text-[#b42318]">Thanh toán chưa được xác nhận</p>
                <p className="mt-1 text-xs leading-5 text-[#475467]">{result.message}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {amount > 0 ? (
                <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Số tiền giao dịch</p>
                  <p className="mt-2 text-base font-black text-[#101828]">{amount.toLocaleString("vi-VN")} ₫</p>
                </article>
              ) : null}
              <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Phương thức</p>
                <p className="mt-2 flex items-center gap-2 text-base font-black text-[#344054]">
                  <CreditCard className="size-5 text-[#667085]" />
                  VNPay
                </p>
              </article>
              {pendingOrderId ? (
                <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Mã đơn hàng</p>
                  <p className="mt-2 break-all text-base font-black text-[#344054]">{pendingOrderId}</p>
                </article>
              ) : null}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d1e9ff] bg-[#eff8ff] p-4">
              <ShoppingBag className="mt-0.5 size-5 shrink-0 text-[#2e90fa]" />
              <div>
                <p className="text-sm font-bold text-[#175cd3]">Sản phẩm trong giỏ hàng vẫn được giữ nguyên</p>
                <p className="mt-1 text-xs leading-5 text-[#475467]">
                  Bạn có thể quay lại giỏ hàng, kiểm tra thông tin và thực hiện thanh toán lại.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button className="h-12 rounded-lg bg-[#3278f6] font-bold hover:bg-[#2860c5]" asChild>
                <Link to="/cart">
                  <ShoppingBag className="size-5" />
                  Quay lại giỏ hàng
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                className="h-12 rounded-lg border-[#d0d5dd] bg-white font-bold text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]"
                variant="outline"
                asChild
              >
                <Link to="/orders">
                  <ReceiptText className="size-5" />
                  Xem đơn hàng
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative grid min-h-[68vh] place-items-center overflow-hidden bg-[#f2f4f7] px-4 py-10 sm:px-6">
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

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_20px_55px_rgba(16,24,40,0.1)]">
        <div className="border-b border-[#e4e7ec] px-6 py-8 text-center sm:px-10">
          <span className="vnpay-result-icon mx-auto grid size-40 place-items-center text-[#12b76a]">
            <svg aria-hidden="true" className="size-32" fill="none" viewBox="0 0 52 52">
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
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#101828] sm:text-4xl">Thanh toán thành công</h1>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Trạng thái</p>
              <p className="mt-2 flex items-center gap-2 text-base font-black text-[#12b76a]">
                <Check className="size-5" strokeWidth={2.6} />
                Đã thanh toán
              </p>
            </article>
            <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Tổng thanh toán</p>
              <p className="mt-2 text-base font-black text-[#101828]">{amount.toLocaleString("vi-VN")} ₫</p>
            </article>
            {transactionNo ? (
              <article className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Mã giao dịch VNPay</p>
                <p className="mt-2 break-all text-base font-black text-[#344054]">{transactionNo}</p>
              </article>
            ) : null}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d1e9ff] bg-[#eff8ff] p-4">
            <ReceiptText className="mt-0.5 size-5 shrink-0 text-[#2e90fa]" />
            <div>
              <p className="text-sm font-bold text-[#175cd3]">Bạn có thể theo dõi đơn hàng bất cứ lúc nào</p>
              <p className="mt-1 text-xs leading-5 text-[#475467]">
                Trạng thái xác nhận và giao hàng sẽ được cập nhật trong mục Đơn hàng của tôi.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button className="h-12 rounded-lg bg-[#3278f6] font-bold hover:bg-[#2860c5]" asChild>
              <Link to="/orders">
                <ReceiptText className="size-5" />
                Xem đơn hàng
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              className="h-12 rounded-lg border-[#d0d5dd] bg-white font-bold text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]"
              variant="outline"
              asChild
            >
              <Link to="/">
                <ShoppingBag className="size-5" />
                Tiếp tục mua hàng
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
