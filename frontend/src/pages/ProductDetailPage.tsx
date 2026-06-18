import { ArrowRight, CheckCircle2, Minus, Plus, Star, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { cartApi, catalogApi, flashSaleApi, getErrorMessage, reviewApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { FlashSaleItem, Product, Review } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ProductDetailPage() {
  const setCart = useCartStore((state) => state.setCart);
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);
  const [dealItem, setDealItem] = useState<FlashSaleItem | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const [productRes, reviewRes, saleRes] = await Promise.all([
          catalogApi.product(id),
          reviewApi.list(id),
          flashSaleApi.active(),
        ]);
        setProduct(productRes.data.data);
        setReviews(reviewRes.data.data);
        setDealItem(saleRes.data.data?.items.find((item) => item.product._id === id && item.sold < item.quantity) || null);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (id) void loadProduct();
  }, [id]);

  const addToCart = async () => {
    if (!product) return;
    try {
      const { data } = await cartApi.add(product._id, quantity);
      setCart(data.data);
      toast.success("Đã thêm sản phẩm vào giỏ");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await reviewApi.create(id, reviewForm);
      const { data } = await reviewApi.list(id);
      setReviews(data.data);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Đã gửi đánh giá");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <div className="rounded-lg border border-[#ededed] bg-white p-8 text-center text-[#8d94ac] shadow-sm">Đang tải chi tiết...</div>;
  }

  if (!product) {
    return <div className="rounded-lg border border-[#ededed] bg-white p-8 text-center text-[#8d94ac] shadow-sm">Không tìm thấy sản phẩm.</div>;
  }

  const specs = product.specs ? Object.entries(product.specs).slice(0, 8) : [];
  const displayPrice = dealItem ? dealItem.dealPrice : product.price;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#ededed] bg-white px-4 py-3 text-sm font-semibold text-[#8d94ac] shadow-sm">
        <Link className="text-[#D91605] hover:underline" to="/">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>{product.category?.name || "Sản phẩm"}</span>
        <span className="mx-2">/</span>
        <span className="text-[#29324e]">{product.name}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[430px_minmax(0,1fr)_300px]">
        <div className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
          <div className="aspect-square rounded-md bg-[#f5f5f5] p-4">
            <img className="h-full w-full object-contain" src={product.images?.[0] || "/icons.svg"} alt={product.name} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(product.images?.length ? product.images : ["/icons.svg", "/icons.svg", "/icons.svg", "/icons.svg"]).slice(0, 4).map((image, index) => (
              <div key={`${image}-${index}`} className="aspect-square rounded-md border border-[#ededed] bg-[#f5f5f5] p-2">
                <img className="h-full w-full object-contain" src={image} alt={`${product.name} ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D91605]">
            {product.category?.name || "Danh mục"} · {product.brand?.name || "Thương hiệu"}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#29324e] sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#8d94ac]">
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="size-4 fill-current" />
              {product.ratingAverage || 0}
            </span>
            <span>({product.ratingCount || 0} đánh giá)</span>
            <span>·</span>
            <span>Đã bán {product.sold || 0}</span>
            <span>·</span>
            <span>Kho {product.stock}</span>
          </div>

          <div className="mt-5 rounded-md bg-[#fff5f5] p-4">
            <p className="text-3xl font-bold text-[#D91605]">{currency.format(displayPrice)}</p>
            {dealItem ? (
              <>
                <p className="mt-1 text-sm text-[#8d94ac] line-through">{currency.format(product.price)}</p>
                <p className="mt-2 text-xs font-bold uppercase text-[#ea580c]">Deal giờ vàng · còn {dealItem.quantity - dealItem.sold} suất</p>
              </>
            ) : product.oldPrice ? <p className="mt-1 text-sm text-[#8d94ac] line-through">{currency.format(product.oldPrice)}</p> : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              "Hàng chính hãng",
              "Bảo hành minh bạch",
              "Hỗ trợ build PC",
            ].map((item) => (
              <div key={item} className="rounded-md border border-[#ededed] bg-[#f5f5f5] p-3 text-sm font-semibold text-[#29324e]">
                <CheckCircle2 className="mb-2 size-4 text-[#D91605]" />
                {item}
              </div>
            ))}
          </div>

          {specs.length > 0 ? (
            <div className="mt-5">
              <h2 className="text-lg font-bold tracking-tight text-[#29324e]">Thông số chính</h2>
              <div className="mt-3 overflow-hidden rounded-md border border-[#ededed]">
                {specs.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[140px_minmax(0,1fr)] border-b border-[#ededed] last:border-b-0">
                    <span className="bg-[#f5f5f5] px-3 py-2 text-sm font-bold text-[#444]">{key}</span>
                    <span className="px-3 py-2 text-sm text-[#29324e]">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-44 lg:self-start">
          <div className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-[#29324e]">Đặt mua nhanh</h2>
            <div className="mt-4 flex items-center gap-2">
              <Button size="icon-sm" variant="outline" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                <Minus className="size-4" />
              </Button>
              <input className="h-9 w-16 rounded-md border border-[#ededed] text-center text-sm font-bold" min={1} type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
              <Button size="icon-sm" variant="outline" onClick={() => setQuantity((current) => current + 1)}>
                <Plus className="size-4" />
              </Button>
            </div>
            <Button className="mt-4 h-11 w-full rounded-md bg-[#D91605] hover:bg-[#b51204]" onClick={() => void addToCart()}>
              Thêm vào giỏ
              <ArrowRight className="size-4" />
            </Button>
            <Button className="mt-2 h-11 w-full rounded-md" variant="outline" asChild>
              <Link to="/cart">Đi tới giỏ hàng</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-[#ededed] bg-white p-4 text-sm text-[#444] shadow-sm">
            <h2 className="mb-3 text-lg font-bold tracking-tight text-[#29324e]">Chính sách bán hàng</h2>
            <p className="mb-2 inline-flex items-center gap-2"><Truck className="size-4 text-[#D91605]" /> Giao hàng toàn quốc</p>
            <p className="mb-2 inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#D91605]" /> Kiểm tra hàng trước khi nhận</p>
            <p className="inline-flex items-center gap-2"><Star className="size-4 text-[#D91605]" /> Tư vấn cấu hình miễn phí</p>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
          <h2 className="border-b border-[#ededed] pb-3 text-xl font-bold tracking-tight text-[#29324e]">Mô tả sản phẩm</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[#29324e]">{product.description || product.shortDescription || "Chưa có mô tả."}</p>
        </section>

        <section className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
          <h2 className="border-b border-[#ededed] pb-3 text-xl font-bold tracking-tight text-[#29324e]">Đánh giá</h2>
          <form onSubmit={submitReview} className="mt-4 grid gap-3">
            <select className="h-10 rounded-md border border-[#ededed] px-3 text-sm" value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} sao</option>
              ))}
            </select>
            <textarea className="min-h-20 rounded-md border border-[#ededed] p-3 text-sm" placeholder="Viết nhận xét..." value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} />
            <Button className="h-10 rounded-md bg-[#D91605] hover:bg-[#b51204]">Gửi đánh giá</Button>
          </form>
          <div className="mt-4 space-y-2">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-md bg-[#f5f5f5] p-3">
                <p className="text-sm font-bold text-[#29324e]">{review.rating} sao</p>
                <p className="text-sm text-[#444]">{review.comment || "Không có bình luận."}</p>
              </div>
            ))}
            {reviews.length === 0 ? <p className="text-sm text-[#8d94ac]">Chưa có đánh giá.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
