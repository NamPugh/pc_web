import {
  ArrowRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Flame,
  Gamepad2,
  Headphones,
  Laptop,
  Monitor,
  MonitorCog,
  PackageCheck,
  Search,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { cartApi, catalogApi, getErrorMessage, newsApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Banner, Brand, Category, News, Product, ProductType } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const localBanners = [
  { _id: "tnc-hero-1", title: "Shopee xanh mát lành", image: "/tnc/hero/banner-shopee-15-6-pc.jpg", link: "/?keyword=Khuyến%20mãi" },
  { _id: "tnc-hero-2", title: "ASUS T1 PC", image: "/tnc/hero/banner-trang-chu-asus-t1-pc-2.jpg", link: "/?keyword=ASUS" },
  { _id: "tnc-hero-3", title: "Build PC Gigabyte Intel", image: "/tnc/hero/banner-build-pc-gigabyte-intel-pc.jpg", link: "/?keyword=Build%20PC" },
  { _id: "tnc-hero-4", title: "MSI Frieren", image: "/tnc/hero/banner-trang-chu-msi-frieren.jpg", link: "/?keyword=RTX%205070" },
  { _id: "tnc-hero-5", title: "Build PC ASUS rinh quà", image: "/tnc/hero/banner-build-pc-asus-rinh-qua-het-nac.jpg", link: "/?keyword=Build%20PC%20ASUS" },
  { _id: "tnc-hero-6", title: "ASUS Hiku", image: "/tnc/hero/banner-trang-chu-asus-hiku.jpg", link: "/?keyword=ASUS" },
  { _id: "tnc-hero-7", title: "Razer lên deal", image: "/tnc/hero/banner-razer-len-deal-gear-len-doi.png", link: "/?keyword=Razer" },
];

const categoryMenu = [
  { label: "Xây dựng cấu hình PC", helper: "PC AMD / PC cao cấp", keyword: "Build PC", icon: MonitorCog },
  { label: "PC Gaming", helper: "Giá tốt, sẵn hàng", keyword: "PC Gaming", icon: Cpu },
  { label: "PC Đồ Họa AI", helper: "Tối ưu công việc", keyword: "PC đồ họa AI", icon: Zap },
  { label: "Laptop - Máy Tính Xách Tay", helper: "Gaming / Văn phòng", keyword: "Laptop", icon: Laptop },
  { label: "Màn Hình Máy Tính", helper: "Gaming / Đồ họa", keyword: "Màn hình", icon: Monitor },
  { label: "Máy chơi game - Console", helper: "PS5 / Nintendo Switch", keyword: "PS5", icon: Gamepad2 },
  { label: "VGA - Card màn hình", helper: "RTX 5060 / RTX 5070", keyword: "RTX", icon: Boxes },
  { label: "Linh kiện máy tính", helper: "CPU / Mainboard / RAM", keyword: "CPU RAM SSD", icon: PackageCheck },
  { label: "Gaming Gears", helper: "Bàn phím / Chuột / Tai nghe", keyword: "Gaming gear", icon: Headphones },
  { label: "Thiết bị văn phòng", helper: "Máy in / Camera / Máy chấm công", keyword: "máy in", icon: PackageCheck },
  { label: "Thiết bị mạng", helper: "Router / Wifi / Switch", keyword: "router wifi", icon: PackageCheck },
  { label: "Khuyến Mãi", helper: "Deal sốc mỗi ngày", keyword: "deal", icon: Flame },
];

const featuredCategories = [
  { title: "PC GAMING", subtitle: "Mua ngay - Giá đang rẻ", keyword: "PC Gaming", image: "/tnc/categories/pc-gaming.jpg" },
  { title: "PC ĐỒ HỌA AI", subtitle: "Tối ưu công việc", keyword: "PC đồ họa AI", image: "/tnc/categories/pc-ai.jpg" },
  { title: "MÀN HÌNH MÁY TÍNH", subtitle: "Thế giới màn hình giá rẻ", keyword: "Màn hình", image: "/tnc/categories/monitor.png" },
  { title: "VGA - CARD MÀN HÌNH", subtitle: "Tổng kho VGA mới", keyword: "RTX", image: "/tnc/categories/vga.png" },
  { title: "LAPTOP GAMING", subtitle: "Cấu hình khủng", keyword: "Laptop Gaming", image: "/tnc/categories/laptop.png" },
  { title: "MÁY CHƠI GAME PS5", subtitle: "Chính hãng", keyword: "PS5 Slim", image: "/tnc/categories/ps5.jpg" },
  { title: "NINTENDO SWITCH", subtitle: "Chơi game tuyệt đỉnh", keyword: "Nintendo Switch", image: "/tnc/categories/handheld.png" },
  { title: "GHẾ GAMING", subtitle: "Hiện đại, tối ưu công năng", keyword: "Ghế gaming", image: "/tnc/categories/chair.png" },
];

const promotionBanners = Array.from({ length: 8 }, (_, index) => ({
  id: `promo-${index + 1}`,
  image: `/tnc/promos/promo-${index + 1}.jpg`,
  keyword: index < 2 ? "PC Gaming" : index < 4 ? "Laptop Gaming" : index < 6 ? "RTX" : "Gaming Gear",
}));

const isUsableBanner = (banner: Banner) =>
  Boolean(banner.image?.trim()) && !banner.image.includes("via.placeholder.com");

const productSections: Array<{ title: string; type?: ProductType; keyword: string }> = [
  { title: "PC Gaming nổi bật", type: "pc", keyword: "PC Gaming" },
  { title: "PC Đồ Họa AI nổi bật", type: "pc", keyword: "PC đồ họa AI" },
  { title: "Laptop - Máy Tính Xách Tay nổi bật", type: "laptop", keyword: "Laptop" },
  { title: "Màn Hình Máy Tính nổi bật", type: "monitor", keyword: "Màn hình" },
  { title: "VGA - Card màn hình nổi bật", type: "gpu", keyword: "RTX" },
  { title: "Gaming Gears nổi bật", keyword: "Gaming Gear" },
];

function ProductCard({ product, onAdd }: { product: Product; onAdd: (productId: string) => void }) {
  return (
    <article className="group flex min-h-full flex-col overflow-hidden border border-[#ededed] bg-white transition hover:border-[#3278f6] hover:shadow-[0_8px_20px_rgba(50,120,246,0.14)]">
      <Link to={`/products/${product._id}`} className="relative block h-[205px] bg-white p-3">
        {product.discount ? <span className="absolute left-0 top-0 z-10 bg-[#fb4e4e] px-2 py-1 text-xs font-bold text-white">-{product.discount}%</span> : null}
        <img className="h-full w-full object-contain transition duration-300 group-hover:scale-105" src={product.images?.[0] || "/icons.svg"} alt={product.name} loading="lazy" />
      </Link>
      <div className="flex flex-1 flex-col border-t-2 border-[#ededed] p-3">
        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#29324e] transition hover:text-[#fb4e4e]">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-[#f5bf02]">
          <Star className="size-3.5 fill-current" />
          <span>{product.ratingAverage?.toFixed(1) || "4.8"}</span>
          <span className="text-[#8d94ac]">·</span>
          <span className="text-[#8d94ac]">Kho {product.stock}</span>
        </div>
        <div className="mt-auto pt-3">
          <p className="text-base font-bold text-[#fb4e4e]">{currency.format(product.price)}</p>
          {product.oldPrice ? <p className="text-xs text-[#8d94ac] line-through">{currency.format(product.oldPrice)}</p> : null}
        </div>
        <Button className="mt-3 h-9 w-full rounded-none bg-[#3278f6] text-xs font-bold hover:bg-[#2860c5]" onClick={() => onAdd(product._id)}>
          <ShoppingCart className="size-4" />
          Thêm giỏ
        </Button>
      </div>
    </article>
  );
}

function SectionHeader({ keyword, title }: { keyword: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#ededed] bg-white pb-3">
      <h2 className="border-b-[3px] border-[#3278f6] pb-1 text-xl font-bold uppercase tracking-tight text-[#29324e] sm:text-2xl">{title}</h2>
      <Link className="hidden items-center gap-1 text-sm font-bold text-[#3278f6] transition hover:text-[#fb4e4e] sm:inline-flex" to={`/?keyword=${encodeURIComponent(keyword)}`}>
        Xem tất cả
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function DealClock() {
  const [remaining, setRemaining] = useState(9 * 3600 + 26 * 60 + 16);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[hours, minutes, seconds].map((time, index) => (
        <span key={`${time}-${index}`} className="grid h-9 w-12 place-items-center bg-[#29324e] text-lg font-bold text-white">
          {time}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get("keyword") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [managedBanners, setManagedBanners] = useState<Banner[]>([]);
  const [keyword, setKeyword] = useState(searchKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("created_desc");
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const mainBanners = managedBanners.filter(
    (banner) => banner.isActive !== false && banner.position === "home_main" && isUsableBanner(banner),
  );
  const displayMainBanners = mainBanners.length ? mainBanners : localBanners;
  const managedPromotions = managedBanners.filter(
    (banner) =>
      banner.isActive !== false &&
      isUsableBanner(banner) &&
      ["home_side", "deal", "category"].includes(banner.position || ""),
  );

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
    const timer = window.setTimeout(() => {
      setKeyword(searchKeyword);
      setDebouncedKeyword(searchKeyword);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveBanner((current) => (current + 1) % displayMainBanners.length),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [displayMainBanners.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveBanner(0), 0);
    return () => window.clearTimeout(timer);
  }, [displayMainBanners.length]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryRes, brandRes, newsRes, bannerRes] = await Promise.all([
          catalogApi.categories(),
          catalogApi.brands(),
          newsApi.list({ status: "published" }),
          catalogApi.banners(),
        ]);
        setCategories(categoryRes.data.data);
        setBrands(brandRes.data.data);
        setNews(newsRes.data.data);
        setManagedBanners(bannerRes.data.data);
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

  const activeCategories = categories.filter((item) => item.isActive !== false).slice(0, 12);
  const dealProducts = products.filter((item) => item.isDeal || item.discount || item.oldPrice).slice(0, 10);
  const displayDeals = dealProducts.length ? dealProducts : products.slice(0, 10);

  return (
    <section className="space-y-8 pb-8">
      <section className="bg-[#f5f5f5]">
        <div className="mx-auto grid max-w-[1600px] gap-3 px-3 lg:grid-cols-[minmax(0,1fr)]">
          <div className="relative overflow-hidden bg-white">
            <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
              {displayMainBanners.map((banner) => (
                <Link key={banner._id} to={banner.link || "/"} className="block min-w-full bg-[#f5f5f5]">
                  <img
                    className="mx-auto aspect-[1600/580] w-full object-cover"
                    src={banner.image}
                    alt={banner.title}
                    onError={(event) => {
                      event.currentTarget.src = localBanners[0].image;
                    }}
                  />
                </Link>
              ))}
            </div>
            <button className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#29324e]/70 text-white transition hover:bg-[#3278f6]" onClick={() => setActiveBanner((activeBanner - 1 + displayMainBanners.length) % displayMainBanners.length)} type="button">
              <ChevronLeft className="size-6" />
            </button>
            <button className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#29324e]/70 text-white transition hover:bg-[#3278f6]" onClick={() => setActiveBanner((activeBanner + 1) % displayMainBanners.length)} type="button">
              <ChevronRight className="size-6" />
            </button>
          </div>
          <div className="-mt-16 hidden justify-center gap-3 px-8 md:flex">
            {displayMainBanners.map((banner, index) => (
              <button key={banner._id} className={`relative h-[62px] w-[180px] overflow-hidden border-2 bg-white ${activeBanner === index ? "border-white" : "border-transparent opacity-75"}`} onClick={() => setActiveBanner(index)} type="button">
                <img
                  className="h-full w-full object-cover"
                  src={banner.image}
                  alt={banner.title}
                  onError={(event) => {
                    event.currentTarget.src = localBanners[index % localBanners.length].image;
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] border border-[#ededed] bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h2 className="border-b-[3px] border-[#3278f6] pb-1 text-2xl font-bold uppercase text-[#111]">Deal giờ vàng</h2>
            <DealClock />
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#3278f6] hover:text-[#fb4e4e]" to="/?keyword=deal">
            Xem tất cả
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="p-10 text-center text-[#8d94ac]">Đang tải sản phẩm...</div>
        ) : displayDeals.length === 0 ? (
          <div className="p-10 text-center text-[#8d94ac]">Chưa có sản phẩm phù hợp.</div>
        ) : (
          <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayDeals.map((product) => (
              <ProductCard key={product._id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-4 px-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border border-[#ededed] bg-white">
          <div className="bg-[#3278f6] px-4 py-3 text-sm font-bold uppercase text-white">Danh mục sản phẩm</div>
          <div className="divide-y divide-[#ededed]">
            {categoryMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#eef4ff]" onClick={() => setKeyword(item.keyword)} type="button">
                  <Icon className="size-5 shrink-0 text-[#3278f6]" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm text-[#29324e]">{item.label}</b>
                    <small className="mt-0.5 block truncate text-xs font-semibold text-[#8d94ac]">{item.helper}</small>
                  </span>
                  <ChevronRight className="size-4 text-[#3278f6]" />
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="border border-[#ededed] bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 border border-[#ededed] bg-[#f5f5f5] px-3">
                <Search className="size-5 text-[#3278f6]" />
                <input className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#8d94ac]" placeholder="Tìm nhanh CPU, VGA, RAM, PS5, laptop gaming..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
              </div>
              <select className="h-11 border border-[#ededed] bg-[#f5f5f5] px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Tất cả danh mục</option>
                {activeCategories.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
              <select className="h-11 border border-[#ededed] bg-[#f5f5f5] px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="created_desc">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="sold_desc">Bán chạy</option>
                <option value="rating_desc">Đánh giá cao</option>
              </select>
            </div>
          </div>

          <section className="border border-[#ededed] bg-white p-5">
            <SectionHeader title="Danh mục nổi bật" keyword="PC Gaming" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featuredCategories.map((item) => (
                <button key={item.title} className="group relative aspect-[1.8/1] overflow-hidden border border-[#ededed] bg-[#f5f5f5] text-left transition hover:border-[#3278f6] hover:shadow-[0_8px_20px_rgba(50,120,246,0.12)]" onClick={() => setKeyword(item.keyword)} type="button">
                  <img className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={item.image} alt={item.title} />
                  <span className="sr-only">{item.title} - {item.subtitle}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] border border-[#ededed] bg-white p-6">
        <SectionHeader title="Chuyên trang khuyến mãi" keyword="Khuyến mãi" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(managedPromotions.length ? managedPromotions : promotionBanners).map((banner) =>
            "keyword" in banner ? (
              <button key={banner.id} className="group aspect-[1.75/1] overflow-hidden border border-[#ededed] bg-[#f5f5f5] transition hover:border-[#3278f6]" onClick={() => setKeyword(banner.keyword)} type="button">
                <img className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={banner.image} alt="Chương trình khuyến mãi" />
              </button>
            ) : (
              <Link key={banner._id} className="group aspect-[1.75/1] overflow-hidden border border-[#ededed] bg-[#f5f5f5] transition hover:border-[#3278f6]" to={banner.link || "/"}>
                <img
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                  src={banner.image}
                  alt={banner.title}
                  onError={(event) => {
                    event.currentTarget.src = promotionBanners[0].image;
                  }}
                />
              </Link>
            ),
          )}
        </div>
      </section>

      {productSections.map((section, sectionIndex) => {
        const sectionProducts = products
          .filter((product) => (section.type ? product.productType === section.type : ["keyboard", "mouse", "headphone"].includes(product.productType)))
          .slice(0, 10);
        const visibleProducts = sectionProducts.length ? sectionProducts : products.slice(0, 10);

        return (
          <div className="contents" key={section.title}>
            {sectionIndex === 2 ? (
              <Link className="mx-auto block max-w-[1600px] overflow-hidden border border-[#ededed] bg-white" to="/?keyword=PC%20Gaming">
                <img className="max-h-[360px] w-full object-cover" src="/banners/pcweb-banner-sheet.png" alt="Khuyến mãi PC Gaming, RTX 5070 và Laptop Gaming" />
              </Link>
            ) : null}
            <section className="mx-auto max-w-[1600px] border border-[#ededed] bg-white p-6">
              <SectionHeader title={section.title} keyword={section.keyword} />
              {loading ? (
                <div className="p-10 text-center text-[#8d94ac]">Đang tải sản phẩm...</div>
              ) : visibleProducts.length === 0 ? (
                <div className="mt-5 border border-dashed border-[#ccc] p-10 text-center text-[#8d94ac]">Chưa có sản phẩm để hiển thị.</div>
              ) : (
                <div className="mt-5 grid gap-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleProducts.map((product) => (
                    <ProductCard key={`${section.title}-${product._id}`} product={product} onAdd={addToCart} />
                  ))}
                </div>
              )}
            </section>
          </div>
        );
      })}

      <section className="mx-auto grid max-w-[1600px] gap-4 px-3 lg:grid-cols-[1fr_1fr]">
        <div className="border border-[#ededed] bg-white p-5">
          <SectionHeader title="Tin tức công nghệ" keyword="Tin tức" />
          <div className="mt-5 grid gap-3">
            {news.slice(0, 3).map((item) => (
              <Link key={item._id} to={`/news/${item.slug}`} className="group grid gap-3 border border-[#ededed] bg-[#f5f5f5] p-3 transition hover:border-[#3278f6] sm:grid-cols-[150px_minmax(0,1fr)]">
                <img className="aspect-video w-full bg-white object-cover" src={item.thumbnail || "/icons.svg"} alt={item.title} />
                <div>
                  <p className="text-xs text-[#8d94ac]">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#29324e] transition group-hover:text-[#3278f6]">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[#444]">{item.summary || item.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-[#ededed] bg-white p-5">
          <SectionHeader title="Thương hiệu đồng hành" keyword="Brand" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {brands.slice(0, 12).map((item) => (
              <button key={item._id} className={`flex min-h-14 items-center justify-center border px-3 text-center text-sm font-bold transition ${brand === item._id ? "border-[#3278f6] bg-[#eef4ff] text-[#3278f6]" : "border-[#ededed] bg-[#f5f5f5] text-[#29324e] hover:border-[#3278f6] hover:text-[#3278f6]"}`} onClick={() => setBrand(brand === item._id ? "" : item._id)} type="button">
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
