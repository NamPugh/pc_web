import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { cartApi, catalogApi, flashSaleApi, getErrorMessage, reviewApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { FlashSaleItem, Product, Review } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const statusInfo = (product: Product) => {
  if (product.status === "inactive") return { label: "Ngừng kinh doanh", tone: "bg-[#f2f4f7] text-[#667085]", purchasable: false };
  if (product.status === "out_of_stock" || product.stock <= 0) return { label: "Hết hàng", tone: "bg-[#fef2f2] text-[#dc2626]", purchasable: false };
  return { label: "Còn hàng", tone: "bg-[#ecfdf3] text-[#15803d]", purchasable: true };
};

export default function ProductDetailPage() {
  const setCart = useCartStore((state) => state.setCart);
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState("/icons.svg");
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [dealItem, setDealItem] = useState<FlashSaleItem | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      catalogApi.product(id),
      reviewApi.list(id),
      flashSaleApi.active(),
    ]).then(([productRes, reviewRes, saleRes]) => {
      if (!active) return;
      const nextProduct = productRes.data.data;
      setProduct(nextProduct);
      setActiveImage(nextProduct.images?.[0] || "/icons.svg");
      setReviews(reviewRes.data.data);
      setDealItem(saleRes.data.data?.items.find((item) => item.product._id === id && item.sold < item.quantity) || null);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      toast.error(getErrorMessage(error));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const specs = useMemo(() => Object.entries(product?.specs || {}), [product?.specs]);

  const addToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      const { data } = await cartApi.add(product._id, quantity);
      setCart(data.data);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewApi.create(id, reviewForm);
      const { data } = await reviewApi.list(id);
      setReviews(data.data);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Đã gửi đánh giá");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="my-8 border border-[#e5e7eb] bg-white p-14 text-center text-sm font-semibold text-[#8d94ac]">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="my-8 border border-[#e5e7eb] bg-white p-14 text-center">
        <PackageCheck className="mx-auto size-10 text-[#98a2b3]" />
        <h1 className="mt-3 text-xl font-black text-[#344054]">Không tìm thấy sản phẩm</h1>
        <Link className="mt-4 inline-flex items-center gap-2 font-bold text-[#3278f6]" to="/">Quay lại trang chủ <ArrowRight className="size-4" /></Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["/icons.svg"];
  const displayPrice = dealItem ? dealItem.dealPrice : product.price;
  const originalPrice = dealItem ? product.price : product.oldPrice;
  const discount = originalPrice && originalPrice > displayPrice
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : product.discount || 0;
  const status = statusInfo(product);
  const maxQuantity = Math.max(Math.min(product.stock, dealItem ? dealItem.quantity - dealItem.sold : product.stock), 1);

  return (
    <section className="space-y-5 pb-10 pt-4">
      <nav className="flex min-w-0 items-center gap-2 overflow-hidden border border-[#e5e7eb] bg-white px-4 py-3 text-xs font-semibold text-[#8d94ac]">
        <Link className="shrink-0 text-[#3278f6] hover:underline" to="/">Trang chủ</Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link className="shrink-0 hover:text-[#3278f6]" to={`/?keyword=${encodeURIComponent(product.category?.name || "")}`}>{product.category?.name || "Sản phẩm"}</Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="truncate text-[#344054]">{product.name}</span>
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(430px,0.9fr)_minmax(0,1.1fr)]">
        <section className="border border-[#e5e7eb] bg-white p-4">
          <div className="relative aspect-square overflow-hidden bg-white">
            {discount > 0 ? <span className="absolute left-0 top-0 z-10 bg-[#fb4e4e] px-3 py-1.5 text-sm font-black text-white">-{discount}%</span> : null}
            {dealItem ? <span className="absolute right-0 top-0 z-10 bg-[#f97316] px-3 py-1.5 text-xs font-black uppercase text-white">Deal giờ vàng</span> : null}
            <img className="h-full w-full object-contain" src={activeImage} alt={product.name} />
          </div>
          <div className="mt-3 grid grid-flow-col auto-cols-[88px] gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                className={`aspect-square overflow-hidden border bg-white p-1 transition ${activeImage === image ? "border-2 border-[#3278f6]" : "border-[#d0d5dd] hover:border-[#3278f6]"}`}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(image)}
                type="button"
              >
                <img className="h-full w-full object-contain" src={image} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 border border-[#e5e7eb] bg-[#f8fafc]">
            {[
              { icon: ShieldCheck, label: "Chính hãng" },
              { icon: RotateCcw, label: "Đổi trả rõ ràng" },
              { icon: Truck, label: "Giao toàn quốc" },
            ].map((item) => {
              const Icon = item.icon;
              return <div className="flex flex-col items-center gap-2 border-r border-[#e5e7eb] p-3 text-center text-xs font-bold text-[#475467] last:border-r-0" key={item.label}><Icon className="size-5 text-[#3278f6]" />{item.label}</div>;
            })}
          </div>
        </section>

        <section className="border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="text-[#3278f6]">{product.category?.name || "Sản phẩm"}</span>
              {product.brand?.name ? <><span className="text-[#d0d5dd]">/</span><span className="text-[#667085]">{product.brand.name}</span></> : null}
              {product.sku ? <><span className="text-[#d0d5dd]">/</span><span className="text-[#98a2b3]">SKU: {product.sku}</span></> : null}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-[#1d2939] sm:text-3xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[#eef0f3] py-3 text-sm">
              <span className="flex items-center gap-1 text-[#f7b500]">
                {Array.from({ length: 5 }, (_, index) => <Star className={`size-4 ${index < Math.round(product.ratingAverage || 0) ? "fill-current" : "fill-[#d7d9df] text-[#d7d9df]"}`} key={index} />)}
              </span>
              <span className="text-[#667085]">{product.ratingAverage?.toFixed(1) || "0.0"} · {product.ratingCount || 0} đánh giá</span>
              <span className="text-[#667085]">Đã bán: <b className="text-[#344054]">{product.sold || 0}</b></span>
              <span className={`px-2.5 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
            </div>

            <div className="mt-5 bg-[#f8faff] p-4">
              <p className="text-sm font-semibold text-[#667085]">Giá bán</p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <strong className="text-3xl font-black text-[#fb4e4e] sm:text-4xl">{currency.format(displayPrice)}</strong>
                {discount > 0 ? <span className="mb-1 border border-[#fb4e4e] px-2 py-1 text-xs font-bold text-[#fb4e4e]">Tiết kiệm {discount}%</span> : null}
              </div>
              {originalPrice && originalPrice > displayPrice ? <p className="mt-2 text-sm text-[#98a2b3]">Giá niêm yết: <span className="line-through">{currency.format(originalPrice)}</span></p> : null}
              {dealItem ? <p className="mt-2 text-xs font-black uppercase text-[#ea580c]">Còn {dealItem.quantity - dealItem.sold} suất ưu đãi</p> : null}
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h2 className="text-base font-black uppercase text-[#344054]">Thông số nổi bật</h2>
              {specs.length ? (
                <div className="mt-3 border border-[#e5e7eb]">
                  {specs.slice(0, 6).map(([key, value], index) => (
                    <div className={`grid grid-cols-[135px_minmax(0,1fr)] text-sm ${index % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}`} key={key}>
                      <span className="border-r border-[#e5e7eb] px-3 py-2.5 font-bold text-[#667085]">{key}</span>
                      <span className="px-3 py-2.5 text-[#344054]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 border border-dashed border-[#d0d5dd] p-5 text-sm text-[#8d94ac]">Thông số đang được cập nhật.</p>}
            </div>

            <aside className="border border-[#cbdcff] bg-[#f8faff] p-4">
              <h2 className="font-black text-[#1d2939]">Mua sản phẩm</h2>
              <p className="mt-1 text-xs text-[#667085]">{status.purchasable ? `Còn ${product.stock} sản phẩm trong kho` : status.label}</p>
              <div className="mt-4 flex h-11 items-center border border-[#d0d5dd] bg-white">
                <button className="grid h-full w-11 place-items-center text-[#667085] hover:bg-[#eef4ff] hover:text-[#3278f6]" disabled={!status.purchasable || quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button"><Minus className="size-4" /></button>
                <input className="h-full min-w-0 flex-1 border-x border-[#d0d5dd] text-center font-black outline-none" disabled={!status.purchasable} max={maxQuantity} min={1} onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))} type="number" value={quantity} />
                <button className="grid h-full w-11 place-items-center text-[#667085] hover:bg-[#eef4ff] hover:text-[#3278f6]" disabled={!status.purchasable || quantity >= maxQuantity} onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))} type="button"><Plus className="size-4" /></button>
              </div>
              <Button className="mt-3 h-12 w-full rounded-none bg-[#3278f6] font-black hover:bg-[#2860c5]" disabled={!status.purchasable || adding} onClick={() => void addToCart()}>
                {adding ? "Đang thêm..." : <><ShoppingCart className="size-5" />Thêm vào giỏ hàng</>}
              </Button>
              <Link className="mt-2 flex h-11 items-center justify-center border border-[#3278f6] text-sm font-bold text-[#3278f6] transition hover:bg-[#eef4ff]" to="/cart">Xem giỏ hàng <ArrowRight className="ml-2 size-4" /></Link>
              <div className="mt-4 space-y-2 border-t border-[#dbe5f8] pt-4 text-xs font-semibold text-[#667085]">
                <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#16a34a]" /> Kiểm tra hàng trước khi nhận</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#16a34a]" /> Tư vấn cấu hình miễn phí</p>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="border border-[#e5e7eb] bg-white">
            <header className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="border-l-4 border-[#3278f6] pl-3 text-xl font-black uppercase text-[#1d2939]">Mô tả sản phẩm</h2></header>
            <div className="whitespace-pre-line p-5 text-sm leading-8 text-[#344054] sm:p-6">{product.description || "Nội dung mô tả đang được cập nhật."}</div>
          </section>

          <section className="border border-[#e5e7eb] bg-white">
            <header className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="border-l-4 border-[#3278f6] pl-3 text-xl font-black uppercase text-[#1d2939]">Thông số kỹ thuật</h2></header>
            {specs.length ? <div className="p-5 sm:p-6"><div className="overflow-hidden border border-[#e5e7eb]">{specs.map(([key, value], index) => <div className={`grid sm:grid-cols-[220px_minmax(0,1fr)] ${index % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}`} key={key}><span className="border-b border-[#e5e7eb] px-4 py-3 text-sm font-bold text-[#667085] sm:border-b-0 sm:border-r">{key}</span><span className="border-b border-[#e5e7eb] px-4 py-3 text-sm text-[#344054] last:border-b-0">{String(value)}</span></div>)}</div></div> : <p className="p-6 text-sm text-[#8d94ac]">Thông số đang được cập nhật.</p>}
          </section>
        </div>

        <section className="border border-[#e5e7eb] bg-white xl:sticky xl:top-40">
          <header className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-xl font-black uppercase text-[#1d2939]">Đánh giá sản phẩm</h2>
            <div className="mt-3 flex items-end gap-3"><strong className="text-4xl font-black text-[#3278f6]">{product.ratingAverage?.toFixed(1) || "0.0"}</strong><div><div className="flex text-[#f7b500]">{Array.from({ length: 5 }, (_, index) => <Star className={`size-4 ${index < Math.round(product.ratingAverage || 0) ? "fill-current" : "fill-[#d7d9df] text-[#d7d9df]"}`} key={index} />)}</div><p className="mt-1 text-xs text-[#8d94ac]">{reviews.length} nhận xét</p></div></div>
          </header>
          <form className="grid gap-3 border-b border-[#e5e7eb] p-5" onSubmit={submitReview}>
            <label><span className="mb-1 block text-xs font-bold text-[#667085]">Mức đánh giá</span><select className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })} value={reviewForm.rating}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</select></label>
            <textarea className="min-h-24 border border-[#d0d5dd] p-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Chia sẻ trải nghiệm của bạn..." value={reviewForm.comment} />
            <Button className="h-11 rounded-none bg-[#3278f6] font-bold hover:bg-[#2860c5]" disabled={submittingReview}>{submittingReview ? "Đang gửi..." : "Gửi đánh giá"}</Button>
          </form>
          <div className="max-h-[520px] divide-y divide-[#eef0f3] overflow-y-auto">
            {reviews.map((review) => (
              <article className="p-5" key={review._id}>
                <div className="flex items-center justify-between gap-3"><p className="font-bold text-[#344054]">{review.user?.userName || "Khách hàng"}</p><span className="flex text-[#f7b500]">{Array.from({ length: 5 }, (_, index) => <Star className={`size-3 ${index < review.rating ? "fill-current" : "fill-[#d7d9df] text-[#d7d9df]"}`} key={index} />)}</span></div>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{review.comment || "Không có nội dung nhận xét."}</p>
              </article>
            ))}
            {!reviews.length ? <p className="p-6 text-center text-sm text-[#8d94ac]">Chưa có đánh giá nào.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
