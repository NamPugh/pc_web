import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { catalogApi, flashSaleApi, getErrorMessage, newsApi } from "@/api/client";
import type { Banner, Brand, FlashSale, FlashSaleItem, HomeSection, News, Product, ProductType } from "@/types";

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

const promotionBanners = Array.from({ length: 8 }, (_, index) => ({
  id: `promo-${index + 1}`,
  image: `/tnc/promos/promo-${index + 1}.jpg`,
  keyword: index < 2 ? "PC Gaming" : index < 4 ? "Laptop Gaming" : index < 6 ? "RTX" : "Gaming Gear",
}));

const isUsableBanner = (banner: Banner) =>
  Boolean(banner.image?.trim()) && !banner.image.includes("via.placeholder.com");

type ProductSection = {
  title: string;
  keyword: string;
  categoryKeywords: string[];
  fallbackTypes?: ProductType[];
  image: string;
};

const productSections: ProductSection[] = [
  { title: "PC Gaming nổi bật", keyword: "PC Gaming", categoryKeywords: ["pc gaming"], fallbackTypes: ["pc"], image: "/tnc/category-banners/cat_big_82_1764436058.jpg" },
  { title: "PC Đồ Họa AI nổi bật", keyword: "PC đồ họa AI", categoryKeywords: ["pc do hoa ai"], image: "/tnc/category-banners/cat_big_210_1764436013.jpg" },
  { title: "Laptop - Máy Tính Xách Tay nổi bật", keyword: "Laptop", categoryKeywords: ["laptop"], fallbackTypes: ["laptop"], image: "/tnc/category-banners/cat_big_79_1764436023.jpg" },
  { title: "Màn Hình Máy Tính nổi bật", keyword: "Màn hình", categoryKeywords: ["man hinh", "monitor"], fallbackTypes: ["monitor"], image: "/tnc/category-banners/cat_big_68_1764436032.jpg" },
  { title: "VGA - Card màn hình nổi bật", keyword: "RTX", categoryKeywords: ["vga", "card man hinh"], fallbackTypes: ["gpu"], image: "/tnc/categories/vga.png" },
  { title: "PlayStation 5 nổi bật", keyword: "PlayStation 5", categoryKeywords: ["may ps5", "playstation 5"], image: "/tnc/category-banners/cat_big_217_1764436040.jpg" },
  {
    title: "Gaming Gears nổi bật",
    keyword: "Gaming Gear",
    categoryKeywords: ["ghe gaming", "gaming gear", "ban phim", "chuot", "tai nghe"],
    fallbackTypes: ["keyboard", "mouse", "headphone"],
    image: "/tnc/category-banners/cat_big_78_1764436048.jpg",
  },
];

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const belongsToSection = (product: Product, section: ProductSection) => {
  const category = normalizeText(product.category?.name || product.category?.slug);
  if (category) {
    return section.categoryKeywords.some((keyword) => category.includes(keyword));
  }
  return Boolean(section.fallbackTypes?.includes(product.productType));
};

function ProductCard({ product }: { product: Product }) {
  const displayDiscount = product.discount ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0);
  const rating = product.ratingAverage || 0;

  return (
    <article className="group relative flex min-h-full min-w-[250px] flex-col overflow-hidden border border-[#e5e7eb] bg-white transition duration-200 after:pointer-events-none after:absolute after:inset-0 after:z-30 after:border-[4px] after:border-transparent after:content-[''] hover:z-10 hover:after:border-[#3278f6]">
      <Link to={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-white p-0.5">
        <span className="absolute left-0 top-0 z-10 bg-[#66ff19] px-2 py-1 text-[11px] font-bold text-black">Best Choice</span>
        <img className="block h-full max-h-full w-full max-w-full object-contain" src={product.images?.[0] || "/icons.svg"} alt={product.name} loading="lazy" />
      </Link>
      <div className="flex flex-1 flex-col border-t border-[#e5e7eb] p-3">
        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-[22px] text-[#35405d] transition hover:text-[#3278f6]">
          {product.name}
        </Link>
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className="flex text-[#f7b500]">
            {Array.from({ length: 5 }, (_, index) => (
              <Star className={`size-3 ${index < Math.round(rating) ? "fill-current" : "fill-[#d7d9df] text-[#d7d9df]"}`} key={index} />
            ))}
          </span>
          <span className="text-[#98a2b3]">{product.ratingCount || 0} đánh giá</span>
        </div>
        <div className="mt-auto pt-3">
          {product.oldPrice ? <p className="text-sm text-[#98a2b3] line-through">{currency.format(product.oldPrice)}</p> : <div className="h-5" />}
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <strong className="text-xl font-bold text-[#fb4e4e]">{currency.format(product.price)}</strong>
            {displayDiscount > 0 ? <span className="border border-[#fb4e4e] px-1.5 py-0.5 text-[11px] font-semibold text-[#fb4e4e]">-{displayDiscount}%</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function DealProductCard({ item }: { item: FlashSaleItem }) {
  const { product } = item;
  const discount = product.price > item.dealPrice
    ? Math.round(((product.price - item.dealPrice) / product.price) * 100)
    : 0;
  const remaining = Math.max(item.quantity - item.sold, 0);
  const rating = product.ratingAverage || 0;

  return (
    <article className="group relative min-w-[230px] flex-1 border-r border-[#e5e7eb] bg-white last:border-r-0">
      <span className="absolute left-0 top-0 z-10 bg-[#f97300] px-2 py-1 text-[11px] font-bold text-white">
        Best choice
      </span>
      <Link className="block h-[240px] overflow-hidden p-5 pt-8" to={`/products/${product._id}`}>
        <img
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          src={product.images?.[0] || "/icons.svg"}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="border-t border-[#e5e7eb] px-3 pb-3 pt-3">
        <Link className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-[22px] text-[#25304e] transition hover:text-[#3278f6]" to={`/products/${product._id}`}>
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className={rating ? "text-[#f7b500]" : "text-[#d0d5dd]"}>
            {"★★★★★"}
          </span>
          <span className="text-[#98a2b3]">{product.ratingCount || 0} đánh giá</span>
        </div>
        <p className="mt-2 text-sm text-[#98a2b3] line-through">{currency.format(product.price)}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <strong className="text-xl font-bold text-[#fb4e4e]">{currency.format(item.dealPrice)}</strong>
          {discount > 0 ? (
            <span className="border border-[#fb4e4e] px-1.5 py-0.5 text-[11px] font-semibold text-[#fb4e4e]">-{discount}%</span>
          ) : null}
        </div>
        <div className="mt-3 bg-[#ff9ca0] py-1 text-center text-xs font-bold text-white">
          Còn lại: {remaining}
        </div>
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

function CategoryBanner({ image, keyword, title }: { image: string; keyword: string; title: string }) {
  return (
    <Link
      className="group relative hidden min-h-[390px] overflow-hidden bg-[#242d49] lg:block"
      to={`/?keyword=${encodeURIComponent(keyword)}`}
    >
      <img
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        src={image}
      />
    </Link>
  );
}

function DealClock({ endAt }: { endAt?: string | null }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const updateRemaining = () => {
      setRemaining(endAt ? Math.max(Math.floor((new Date(endAt).getTime() - Date.now()) / 1000), 0) : 0);
    };
    const initialTimer = window.setTimeout(updateRemaining, 0);
    const interval = window.setInterval(updateRemaining, 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [endAt]);

  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[hours, minutes, seconds].map((time, index) => (
        <div className="flex items-center gap-2" key={`${time}-${index}`}>
          <span className="grid h-9 w-14 place-items-center bg-[#29324e] text-lg font-bold text-white">
            {time}
          </span>
          {index < 2 ? <span className="text-xl font-black text-[#111]">:</span> : null}
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const dealSliderRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get("keyword") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSale, setActiveSale] = useState<FlashSale | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [managedBanners, setManagedBanners] = useState<Banner[]>([]);
  const [managedProductSections, setManagedProductSections] = useState<HomeSection[]>([]);
  const [keyword, setKeyword] = useState(searchKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
  const [brand, setBrand] = useState("");
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
      brand: brand || undefined,
      sort: "created_desc",
      limit: 500,
    }),
    [brand, debouncedKeyword],
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
        const [brandRes, newsRes, bannerRes, dealRes, homeSectionRes] = await Promise.all([
          catalogApi.brands(),
          newsApi.list({ status: "published" }),
          catalogApi.banners(),
          flashSaleApi.active(),
          catalogApi.homeSections({ isActive: true }),
        ]);
        setBrands(brandRes.data.data);
        setNews(newsRes.data.data);
        setManagedBanners(bannerRes.data.data);
        setActiveSale(dealRes.data.data);
        setManagedProductSections(homeSectionRes.data.data);
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

  const dealItems = activeSale?.items.filter((item) => item.sold < item.quantity) || [];

  const scrollDeals = (direction: "left" | "right") => {
    dealSliderRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
  };

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

      <section className="mx-auto max-w-[1600px] bg-white px-2 py-5 sm:px-3">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="border-b-[3px] border-[#3278f6] pb-1 text-2xl font-bold uppercase leading-none text-black">Deal giờ vàng</h2>
            <span className="hidden h-7 w-px rotate-[18deg] bg-[#d0d5dd] sm:block" />
            <DealClock endAt={activeSale?.endAt} />
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#3278f6] hover:text-[#fb4e4e]" to="/?keyword=deal">
            Xem tất cả
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {loading ? (
          <div className="p-10 text-center text-[#8d94ac]">Đang tải sản phẩm...</div>
        ) : dealItems.length === 0 ? (
          <div className="border border-dashed border-[#d0d5dd] p-10 text-center text-[#8d94ac]">Chưa có Deal giờ vàng đang diễn ra.</div>
        ) : (
          <div className="relative border border-[#e5e7eb]">
            <button
              aria-label="Xem deal trước"
              className="absolute left-0 top-1/2 z-20 grid h-10 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-r bg-[#7d879d] text-white shadow transition hover:bg-[#3278f6]"
              onClick={() => scrollDeals("left")}
              type="button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div
              className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              ref={dealSliderRef}
            >
              {dealItems.map((item) => (
                <div className="min-w-[230px] snap-start sm:min-w-[250px] lg:min-w-[20%]" key={item._id}>
                  <DealProductCard item={item} />
                </div>
              ))}
            </div>
            <button
              aria-label="Xem deal tiếp theo"
              className="absolute right-0 top-1/2 z-20 grid h-10 w-7 translate-x-1/2 -translate-y-1/2 place-items-center rounded-l bg-[#7d879d] text-white shadow transition hover:bg-[#3278f6]"
              onClick={() => scrollDeals("right")}
              type="button"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
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

      {(managedProductSections.length ? managedProductSections : productSections).map((section) => {
        const isManagedSection = "bannerImage" in section;
        const sectionProducts = isManagedSection
          ? section.products.slice(0, 4)
          : products.filter((product) => belongsToSection(product, section)).slice(0, 4);
        const sectionImage = isManagedSection ? section.bannerImage : section.image;

        return (
          <div className="contents" key={isManagedSection ? section._id : section.title}>
            <section className="mx-auto max-w-[1600px] border border-[#ededed] bg-white px-4 py-5 sm:px-6">
              <SectionHeader title={section.title} keyword={section.keyword || section.title} />
              {loading ? (
                <div className="p-10 text-center text-[#8d94ac]">Đang tải sản phẩm...</div>
              ) : sectionProducts.length === 0 ? (
                <div className="mt-5 border border-dashed border-[#ccc] p-10 text-center text-[#8d94ac]">Chưa có sản phẩm để hiển thị.</div>
              ) : (
                <div className="mt-5 grid overflow-hidden border border-[#e5e7eb] lg:grid-cols-[260px_minmax(0,1fr)]">
                  <CategoryBanner image={sectionImage} keyword={section.keyword || section.title} title={section.title} />
                  <div className="grid gap-px overflow-x-auto bg-[#e5e7eb] [grid-template-columns:repeat(4,minmax(250px,1fr))]">
                    {sectionProducts.map((product) => (
                      <ProductCard key={`${section.title}-${product._id}`} product={product} />
                    ))}
                  </div>
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
