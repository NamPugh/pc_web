import { ArrowRight, BadgePercent, Boxes, ChevronRight, Cpu, Flame, Gamepad2, Headphones, Laptop, Monitor, MonitorCog, PackageCheck, Search, ShieldCheck, ShoppingCart, Star, Truck, Tv2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import heroImage from "@/assets/hero.png";
import { cartApi, catalogApi, getErrorMessage, newsApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Banner, Brand, Category, News, Product, ProductType } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const categoryMenu = [
  { label: "Xây dựng cấu hình PC", keyword: "Build PC", icon: MonitorCog },
  { label: "PC AMD", keyword: "PC AMD", icon: Cpu },
  { label: "PC Cao Cấp", keyword: "PC cao cấp", icon: Cpu },
  { label: "PC Gaming", keyword: "PC Gaming", icon: Cpu },
  { label: "PC Đồ Họa AI", keyword: "PC đồ họa AI", icon: Zap },
  { label: "Laptop - Máy Tính Xách Tay", keyword: "Laptop", icon: Laptop },
  { label: "Laptop Gaming", keyword: "Laptop Gaming", icon: Laptop },
  { label: "Laptop Văn Phòng", keyword: "Laptop văn phòng", icon: Laptop },
  { label: "Màn Hình Máy Tính", keyword: "Màn hình", icon: Monitor },
  { label: "Máy chơi game - Console", keyword: "PS5", icon: Gamepad2 },
  { label: "Tay Cầm Chơi Game", keyword: "tay cầm", icon: Gamepad2 },
  { label: "VGA - Card màn hình", keyword: "RTX", icon: Boxes },
  { label: "Linh kiện máy tính", keyword: "CPU RAM SSD", icon: PackageCheck },
  { label: "Gaming Gears", keyword: "Gaming gear", icon: Headphones },
  { label: "PC Văn Phòng", keyword: "PC văn phòng", icon: Boxes },
  { label: "Phụ Kiện - Tản Nhiệt PC", keyword: "tản nhiệt", icon: PackageCheck },
  { label: "Thiết bị văn phòng", keyword: "máy in", icon: PackageCheck },
  { label: "Thiết bị mạng", keyword: "router wifi", icon: PackageCheck },
  { label: "Khuyến Mãi", keyword: "deal", icon: Flame },
];

const featuredCategories = [
  { title: "PC GAMING", subtitle: "Mua ngay - Giá đang rẻ", keyword: "PC Gaming", icon: Cpu },
  { title: "PC ĐỒ HỌA AI", subtitle: "Tối ưu công việc", keyword: "PC đồ họa AI", icon: Zap },
  { title: "MÀN HÌNH", subtitle: "2K, 4K, 240Hz", keyword: "Màn hình", icon: Tv2 },
  { title: "VGA - CARD", subtitle: "Tổng kho RTX giá tốt", keyword: "RTX", icon: Boxes },
  { title: "LAPTOP GAMING", subtitle: "Cấu hình mạnh", keyword: "Laptop Gaming", icon: Laptop },
  { title: "PS5 SLIM", subtitle: "Console chính hãng", keyword: "PS5 Slim", icon: Gamepad2 },
  { title: "GAMING GEAR", subtitle: "Chuột, phím, tai nghe", keyword: "Gaming Gear", icon: Headphones },
  { title: "BUILD PC", subtitle: "Chọn linh kiện nhanh", keyword: "Build PC", icon: MonitorCog },
];

const productSections: Array<{ title: string; subtitle: string; type?: ProductType; keyword: string }> = [
  { title: "PC Gaming nổi bật", subtitle: "Cấu hình chiến game", type: "pc", keyword: "PC Gaming" },
  { title: "Laptop Gaming nổi bật", subtitle: "Hiệu năng di động", type: "laptop", keyword: "Laptop Gaming" },
  { title: "Màn Hình Máy Tính nổi bật", subtitle: "Mượt, sắc, đúng màu", type: "monitor", keyword: "Màn hình" },
  { title: "VGA - Card màn hình nổi bật", subtitle: "RTX và GPU hiệu năng cao", type: "gpu", keyword: "RTX" },
  { title: "Gaming Gears nổi bật", subtitle: "Chuột, phím, tai nghe", keyword: "Gaming Gear" },
];

function ProductCard({ product, onAdd }: { product: Product; onAdd: (productId: string) => void }) {
  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded border border-slate-200 bg-white transition hover:border-[#d71920] hover:shadow-md">
      <Link to={`/products/${product._id}`} className="relative block aspect-square bg-slate-50 p-3">
        {product.discount ? <span className="absolute left-2 top-2 z-10 rounded bg-[#d71920] px-2 py-1 text-xs font-bold text-white">-{product.discount}%</span> : null}
        <img className="h-full w-full object-contain transition duration-300 group-hover:scale-105" src={product.images?.[0] || "/icons.svg"} alt={product.name} loading="lazy" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 transition hover:text-[#d71920]">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-amber-500">
          <Star className="size-3.5 fill-current" />
          <span>{product.ratingAverage?.toFixed(1) || "4.8"}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Kho {product.stock}</span>
        </div>
        <div className="mt-auto">
          <p className="text-base font-bold text-[#d71920]">{currency.format(product.price)}</p>
          {product.oldPrice ? <p className="text-xs text-slate-400 line-through">{currency.format(product.oldPrice)}</p> : null}
        </div>
        <Button className="h-8 w-full rounded bg-[#d71920] text-xs hover:bg-[#b80d18]" onClick={() => onAdd(product._id)}>
          <ShoppingCart className="size-4" />
          Thêm giỏ
        </Button>
      </div>
    </article>
  );
}

function SectionHeader({ title, subtitle, keyword }: { title: string; subtitle: string; keyword: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
      </div>
      <Link className="hidden items-center gap-1 text-sm font-bold text-[#d71920] hover:underline sm:inline-flex" to={`/?keyword=${encodeURIComponent(keyword)}`}>
        Xem tất cả
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get("keyword") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [keyword, setKeyword] = useState(searchKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("created_desc");
  const [loading, setLoading] = useState(true);

  const params = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      category: category || undefined,
      brand: brand || undefined,
      sort,
      limit: 32,
    }),
    [brand, category, debouncedKeyword, sort],
  );

  useEffect(() => {
    setKeyword(searchKeyword);
    setDebouncedKeyword(searchKeyword);
  }, [searchKeyword]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryRes, brandRes, bannerRes, newsRes] = await Promise.all([
          catalogApi.categories(),
          catalogApi.brands(),
          catalogApi.banners(),
          newsApi.list({ status: "published" }),
        ]);
        setCategories(categoryRes.data.data);
        setBrands(brandRes.data.data);
        setBanners(bannerRes.data.data);
        setNews(newsRes.data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    void loadFilters();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data } = await catalogApi.products(params);
        setProducts(data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [params]);

  const addToCart = async (productId: string) => {
    try {
      await cartApi.add(productId);
      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const heroBanner = banners[0];
  const promoBanners = banners.slice(1, 4);
  const activeCategories = categories.filter((item) => item.isActive !== false).slice(0, 9);
  const dealProducts = products.filter((item) => item.isDeal || item.discount || item.oldPrice).slice(0, 8);
  const displayDeals = dealProducts.length ? dealProducts : products.slice(0, 8);

  return (
    <section className="space-y-5 pb-4">
      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#d71920] px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white">Danh mục sản phẩm</div>
          <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
            {categoryMenu.map((item) => {
              const Icon = item.icon;

              return (
                <button key={item.label} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition hover:bg-red-50 hover:text-[#d71920]" onClick={() => setKeyword(item.keyword)}>
                  <Icon className="size-4 shrink-0 text-[#d71920]" />
                  <span className="line-clamp-1 flex-1">{item.label}</span>
                  <ChevronRight className="size-4 text-slate-300" />
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <Link to={heroBanner?.link || "/?keyword=PC%20Gaming"} className="group relative min-h-[360px] overflow-hidden rounded bg-[#111] shadow-sm">
              <img className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" src={heroBanner?.image || heroImage} alt={heroBanner?.title || "PC gaming"} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/35 to-transparent" />
              <div className="relative flex min-h-[360px] max-w-xl flex-col justify-center p-6 text-white sm:p-8">
                <span className="inline-flex w-fit items-center gap-2 rounded bg-[#d71920] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <BadgePercent className="size-4" />
                  Deal giờ vàng
                </span>
                <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">PC gaming, PS5, RTX 5070 và gear giá tốt</h1>
                <p className="mt-4 text-sm leading-7 text-white/80">Giá rẻ, hàng chất, tư vấn cấu hình nhanh và nhiều khuyến mãi cho game thủ.</p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded bg-white px-4 py-3 text-sm font-bold text-[#d71920]">
                  Mua ngay
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {(promoBanners.length ? promoBanners : [
                { _id: "promo-pc", title: "Build PC là dễ", image: heroImage, link: "/build-pc" },
                { _id: "promo-vga", title: "RTX 5070 giá tốt", image: heroImage, link: "/?keyword=RTX%205070" },
                { _id: "promo-gear", title: "Gaming gear hot", image: heroImage, link: "/?keyword=Gaming%20gear" },
              ]).map((banner) => (
                <Link key={banner._id} to={banner.link || "/"} className="group relative min-h-28 overflow-hidden rounded bg-slate-900">
                  <img className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105" src={banner.image} alt={banner.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold text-white">{banner.title}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, title: "Giao nhanh", text: "Đóng gói kỹ, toàn quốc" },
              { icon: ShieldCheck, title: "Hàng chính hãng", text: "Bảo hành minh bạch" },
              { icon: MonitorCog, title: "Tư vấn build", text: "Theo game và ngân sách" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-center gap-3 rounded border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="grid size-10 place-items-center rounded bg-red-50 text-[#d71920]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded bg-[#111] p-4 text-white shadow-sm">
            <Flame className="size-7 text-red-300" />
            <p className="mt-3 text-2xl font-bold">Deal giờ vàng</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {["09", "51", "54"].map((time, index) => (
                <div key={`${time}-${index}`} className="rounded bg-white px-2 py-3 text-xl font-bold text-[#d71920]">{time}</div>
              ))}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-950">Thương hiệu</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.slice(0, 10).map((item) => (
                <button key={item._id} className={`rounded border px-2.5 py-1.5 text-xs font-bold transition ${brand === item._id ? "border-[#d71920] bg-red-50 text-[#d71920]" : "border-slate-200 text-slate-600 hover:border-[#d71920] hover:text-[#d71920]"}`} onClick={() => setBrand(brand === item._id ? "" : item._id)}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3">
            <Search className="size-5 text-[#d71920]" />
            <input className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Tìm nhanh CPU, VGA, RAM, PS5, laptop gaming..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>
          <select className="h-11 rounded border border-slate-200 bg-slate-50 px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {activeCategories.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
          <select className="h-11 rounded border border-slate-200 bg-slate-50 px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="created_desc">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="sold_desc">Bán chạy</option>
            <option value="rating_desc">Đánh giá cao</option>
          </select>
        </div>
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-red-300" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Deal giờ vàng</h2>
              <p className="text-xs text-white/65">Giá tốt, số lượng có hạn</p>
            </div>
          </div>
          <Link to="/?keyword=deal" className="rounded bg-[#d71920] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">Xem tất cả</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải sản phẩm...</div>
        ) : displayDeals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có sản phẩm phù hợp.</div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {displayDeals.map((product) => (
              <ProductCard key={product._id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <SectionHeader title="Danh mục nổi bật" subtitle="Mua nhanh theo nhu cầu" keyword="PC Gaming" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredCategories.map((item) => {
            const Icon = item.icon;

            return (
              <button key={item.title} className="group flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#d71920] hover:bg-red-50" onClick={() => setKeyword(item.keyword)}>
                <div className="grid size-12 place-items-center rounded bg-white text-[#d71920] shadow-sm transition group-hover:bg-[#d71920] group-hover:text-white">
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {productSections.map((section) => {
        const sectionProducts = products
          .filter((product) => (section.type ? product.productType === section.type : ["keyboard", "mouse", "headphone"].includes(product.productType)))
          .slice(0, 8);
        const visibleProducts = sectionProducts.length ? sectionProducts : products.slice(0, 8);

        return (
          <section key={section.title} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader title={section.title} subtitle={section.subtitle} keyword={section.keyword} />
            {loading ? (
              <div className="p-8 text-center text-slate-500">Đang tải sản phẩm...</div>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-4 rounded border border-dashed border-slate-300 p-8 text-center text-slate-500">Chưa có sản phẩm để hiển thị.</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={`${section.title}-${product._id}`} product={product} onAdd={addToCart} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeader title="Tin tức" subtitle="Kênh công nghệ" keyword="Tin tức" />
          <div className="mt-4 grid gap-3">
            {news.slice(0, 3).map((item) => (
              <Link key={item._id} to={`/news/${item.slug}`} className="group grid gap-3 rounded border border-slate-200 bg-slate-50 p-3 transition hover:border-[#d71920] sm:grid-cols-[130px_minmax(0,1fr)]">
                <img className="aspect-video w-full rounded bg-slate-100 object-cover" src={item.thumbnail || "/icons.svg"} alt={item.title} />
                <div>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-950 transition group-hover:text-[#d71920]">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary || item.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Thương hiệu đồng hành" subtitle="Brand wall" keyword="Brand" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {brands.slice(0, 12).map((item) => (
              <button key={item._id} className="flex min-h-14 items-center justify-center rounded border border-slate-200 bg-slate-50 px-3 text-center text-sm font-bold text-slate-700 transition hover:border-[#d71920] hover:text-[#d71920]" onClick={() => setBrand(item._id)}>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
