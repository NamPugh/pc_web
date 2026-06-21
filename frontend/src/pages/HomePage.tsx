import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Star,
} from "lucide-react";
import { Select } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { catalogApi, flashSaleApi, getErrorMessage } from "@/api/client";
import type { Banner, Brand, Category, FlashSale, FlashSaleItem, HomeSection, Product, ProductType } from "@/types";

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

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const displayDiscount = product.discount ||
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0);
  const rating = product.ratingAverage || 0;

  return (
    <article className={`group relative flex min-h-full flex-col overflow-hidden border border-[#e5e7eb] bg-white transition duration-200 after:pointer-events-none after:absolute after:inset-0 after:z-30 after:border-[4px] after:border-transparent after:content-[''] hover:z-10 hover:after:border-[#3278f6] ${compact ? "min-w-0" : "min-w-[250px]"}`}>
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

const priceRanges = [
  { id: "under-10", label: "Dưới 10 triệu", min: 0, max: 10_000_000 },
  { id: "10-20", label: "10 triệu - 20 triệu", min: 10_000_000, max: 20_000_000 },
  { id: "20-30", label: "20 triệu - 30 triệu", min: 20_000_000, max: 30_000_000 },
  { id: "30-50", label: "30 triệu - 50 triệu", min: 30_000_000, max: 50_000_000 },
  { id: "50-80", label: "50 triệu - 80 triệu", min: 50_000_000, max: 80_000_000 },
  { id: "over-80", label: "Trên 80 triệu", min: 80_000_000, max: Number.POSITIVE_INFINITY },
];

const productTypeLabels: Partial<Record<ProductType, string>> = {
  pc: "PC",
  laptop: "Laptop",
  monitor: "Màn hình",
  gpu: "Card màn hình",
  cpu: "CPU",
  mainboard: "Mainboard",
  ram: "RAM",
  ssd: "SSD",
  hdd: "HDD",
  case: "Vỏ case",
  psu: "Nguồn",
  keyboard: "Bàn phím",
  mouse: "Chuột",
  headphone: "Tai nghe",
  cooler: "Tản nhiệt",
  other: "Khác",
};

function FilterGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="border-b border-[#d8dce3] py-5 last:border-b-0">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[#667085]">
        <span>{title}</span><ChevronDown className="size-4" />
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function SearchResults({
  brands,
  categories,
  categoryId,
  keyword,
  showAll = false,
  title,
}: {
  brands: Brand[];
  categories: Category[];
  categoryId?: string;
  keyword: string;
  showAll?: boolean;
  title: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryId ? [categoryId] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRanges, setSelectedRanges] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);

  const pageSize = 20;

  useEffect(() => {
    let active = true;
    void catalogApi.products({
      keyword: keyword || undefined,
      category: selectedCategories.length ? selectedCategories.join(",") : undefined,
      brand: selectedBrands.length ? selectedBrands.join(",") : undefined,
      productType: selectedTypes.length ? selectedTypes.join(",") : undefined,
      priceRanges: selectedRanges.length ? selectedRanges.join(",") : undefined,
      sort: sort === "default" ? "created_desc" : sort,
      status: "active",
      page,
      limit: pageSize,
    }).then(({ data }) => {
      if (!active) return;
      setProducts(data.data);
      setTotal(data.total || 0);
      setTotalPages(Math.max(data.totalPages || 1, 1));
    }).catch((error: unknown) => {
      if (active) toast.error(getErrorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [keyword, page, selectedBrands, selectedCategories, selectedRanges, selectedTypes, sort]);

  const toggleValue = <T extends string>(values: T[], value: T, setter: (next: T[]) => void) => {
    setLoading(true);
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setPage(1);
  };

  const clearFilters = () => {
    setLoading(true);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRanges([]);
    setSelectedTypes([]);
    setSort("default");
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = selectedCategories.length + selectedBrands.length + selectedRanges.length + selectedTypes.length > 0;

  return (
    <section className="mx-auto w-full max-w-[1600px]">
      <div className="grid items-start gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="border border-[#e5e7eb] bg-white px-5 lg:sticky lg:top-40">
          <div className="flex items-center justify-between border-b border-[#d8dce3] py-5">
            <h2 className="text-xl font-bold leading-[1.35] tracking-normal text-[#1d2939]">{showAll ? "Danh mục sản phẩm" : "Bộ lọc sản phẩm"}</h2>
            {hasFilters ? <button className="text-[#3278f6]" onClick={clearFilters} title="Xóa bộ lọc" type="button"><RotateCcw className="size-4" /></button> : null}
          </div>

          <FilterGroup title="Danh mục">
            {categories.map((option) => (
               <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={option._id}>
                <input checked={selectedCategories.includes(option._id)} className="size-4 accent-[#3278f6]" onChange={() => toggleValue(selectedCategories, option._id, setSelectedCategories)} type="checkbox" />
                <span className="min-w-0 flex-1 truncate">{option.name}</span>
              </label>
            ))}
          </FilterGroup>

          {!showAll && brands.length ? (
            <FilterGroup title="Hãng sản xuất">
              {brands.map((option) => (
                 <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={option._id}>
                  <input checked={selectedBrands.includes(option._id)} className="size-4 accent-[#3278f6]" onChange={() => toggleValue(selectedBrands, option._id, setSelectedBrands)} type="checkbox" />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                </label>
              ))}
            </FilterGroup>
          ) : null}

          {!showAll ? <FilterGroup title="Khoảng giá (VNĐ)">
            {priceRanges.map((range) => (
                 <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={range.id}>
                  <input checked={selectedRanges.includes(range.id)} className="size-4 accent-[#3278f6]" onChange={() => toggleValue(selectedRanges, range.id, setSelectedRanges)} type="checkbox" />
                  <span className="min-w-0 flex-1">{range.label}</span>
                </label>
            ))}
          </FilterGroup> : null}

          {!showAll ? <FilterGroup title="Loại sản phẩm">
            {(Object.entries(productTypeLabels) as Array<[ProductType, string]>).map(([id, name]) => (
               <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={id}>
                <input checked={selectedTypes.includes(id)} className="size-4 accent-[#3278f6]" onChange={() => toggleValue(selectedTypes, id, setSelectedTypes)} type="checkbox" />
                <span className="min-w-0 flex-1">{name}</span>
              </label>
            ))}
          </FilterGroup> : null}
        </aside>

        <div className="min-w-0 border border-[#e5e7eb] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
            <h1 className="w-fit border-b-[3px] border-[#3278f6] pb-1 text-2xl font-bold uppercase leading-[1.35] text-black">
              {showAll ? "Tất cả sản phẩm" : <>Kết quả tìm kiếm: &quot;{title}&quot;</>}
            </h1>
            <div className="flex items-center gap-3 text-sm text-[#8d94ac]">
              {!loading ? <span>{total} sản phẩm</span> : null}
              <span className="h-6 w-px bg-[#d0d5dd]" />
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Hiển thị theo:</span>
                <Select.Root onValueChange={(value) => { setLoading(true); setSort(value); setPage(1); }} value={sort}>
                  <Select.Trigger className="inline-flex h-10 min-w-36 items-center justify-between gap-3 rounded border border-[#d0d5dd] bg-white px-3 font-bold text-[#344054] outline-none transition hover:border-[#9cbcff] focus:border-[#3278f6] focus:ring-2 focus:ring-[#3278f6]/10">
                    <Select.Value />
                    <Select.Icon><ChevronDown className="size-4 text-[#667085]" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-[120] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-[#d0d5dd] bg-white p-1 shadow-[0_12px_28px_rgba(41,50,78,0.16)]" position="popper" sideOffset={5}>
                      <Select.Viewport>
                        {[
                          { value: "default", label: "Mặc định" },
                          { value: "price_asc", label: "Giá tăng dần" },
                          { value: "price_desc", label: "Giá giảm dần" },
                          { value: "rating_desc", label: "Đánh giá cao" },
                          { value: "sold_desc", label: "Bán chạy" },
                        ].map((option) => (
                          <Select.Item className="relative flex h-10 cursor-pointer select-none items-center rounded px-3 pr-9 text-sm font-medium text-[#344054] outline-none data-[highlighted]:bg-[#eef4ff] data-[highlighted]:text-[#3278f6] data-[state=checked]:font-bold data-[state=checked]:text-[#3278f6]" key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-3"><Check className="size-4" /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-14 text-center text-[#8d94ac]">Đang tìm sản phẩm...</div>
          ) : products.length === 0 ? (
            <div className="mt-5 border border-dashed border-[#d0d5dd] p-14 text-center">
              <Search className="mx-auto size-9 text-[#98a2b3]" />
              <h2 className="mt-3 font-bold text-[#344054]">Không có sản phẩm phù hợp bộ lọc</h2>
              <button className="mt-3 text-sm font-bold text-[#3278f6]" onClick={clearFilters} type="button">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="mt-5 grid gap-px bg-[#e5e7eb] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map((product) => <ProductCard compact key={product._id} product={product} />)}
            </div>
          )}

          {!loading && total > pageSize ? (
            <nav aria-label="Phân trang sản phẩm" className="mt-6 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#e5e7eb] pt-5">
              <button
                aria-label="Trang trước"
                className="grid size-10 place-items-center rounded-lg border border-[#d0d5dd] bg-white text-[#667085] transition hover:border-[#3278f6] hover:text-[#3278f6] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                const start = Math.min(Math.max(page - 3, 1), Math.max(totalPages - 6, 1));
                const pageNumber = start + index;
                return (
                  <button
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={`grid size-10 place-items-center rounded-lg text-sm font-bold transition ${pageNumber === page ? "bg-[#3278f6] text-white shadow-[0_5px_14px_rgba(50,120,246,0.25)]" : "border border-[#d0d5dd] bg-white text-[#344054] hover:border-[#3278f6] hover:text-[#3278f6]"}`}
                    key={pageNumber}
                    onClick={() => changePage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                aria-label="Trang tiếp theo"
                className="grid size-10 place-items-center rounded-lg border border-[#d0d5dd] bg-white text-[#667085] transition hover:border-[#3278f6] hover:text-[#3278f6] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page === totalPages}
                onClick={() => changePage(page + 1)}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </section>
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
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden bg-white transition duration-200 after:pointer-events-none after:absolute after:inset-0 after:z-30 after:border-[4px] after:border-transparent after:content-[''] hover:z-10 hover:after:border-[#3278f6]">
      <span className="absolute left-0 top-0 z-10 bg-[#f97300] px-2 py-1 text-[11px] font-bold text-white">
        Best choice
      </span>
      <Link className="relative block aspect-square overflow-hidden bg-white p-0.5" to={`/products/${product._id}`}>
        <img
          className="block h-full max-h-full w-full max-w-full object-contain transition duration-300 group-hover:scale-105"
          src={product.images?.[0] || "/icons.svg"}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col border-t border-[#e5e7eb] p-3">
        <Link className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-[22px] text-[#25304e] transition hover:text-[#3278f6]" to={`/products/${product._id}`}>
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className={rating ? "text-[#f7b500]" : "text-[#d0d5dd]"}>
            {"★★★★★"}
          </span>
          <span className="text-[#98a2b3]">{product.ratingCount || 0} đánh giá</span>
        </div>
        <div className="mt-auto pt-3">
          <p className="text-sm text-[#98a2b3] line-through">{currency.format(product.price)}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <strong className="text-xl font-bold text-[#fb4e4e]">{currency.format(item.dealPrice)}</strong>
            {discount > 0 ? (
              <span className="border border-[#fb4e4e] px-1.5 py-0.5 text-[11px] font-semibold text-[#fb4e4e]">-{discount}%</span>
            ) : null}
          </div>
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
  const searchCategoryId = searchParams.get("category") || "";
  const searchCategoryName = searchParams.get("categoryName") || "";
  const showAllProducts = searchParams.get("all") === "1";
  const hasSearchFilter = Boolean(searchKeyword || searchCategoryId || showAllProducts);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSale, setActiveSale] = useState<FlashSale | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
      status: "active",
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
        const [brandRes, categoryRes, bannerRes, dealRes, homeSectionRes] = await Promise.all([
          catalogApi.brands(),
          catalogApi.categories(),
          catalogApi.banners(),
          flashSaleApi.active(),
          catalogApi.homeSections({ isActive: true }),
        ]);
        setBrands(brandRes.data.data);
        setCategories(categoryRes.data.data.filter((category) => category.isActive !== false));
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
    if (hasSearchFilter) return;
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
  }, [hasSearchFilter, params]);

  const dealItems = activeSale?.items.filter((item) => item.sold < item.quantity) || [];

  const scrollDeals = (direction: "left" | "right") => {
    dealSliderRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-8 pb-8">
      {!hasSearchFilter ? <section className="bg-[#f5f5f5]">
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
      </section> : null}

      {hasSearchFilter ? (
        <SearchResults
          brands={brands}
          categories={categories}
          categoryId={searchCategoryId}
          key={`${searchKeyword}-${searchCategoryId}-${showAllProducts}`}
          keyword={searchKeyword}
          showAll={showAllProducts && !searchKeyword && !searchCategoryId}
          title={searchKeyword || searchCategoryName || "Danh mục sản phẩm"}
        />
      ) : null}

      {!hasSearchFilter ? <section className="mx-auto max-w-[1600px] bg-white px-2 py-5 sm:px-3">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="border-b-[3px] border-[#3278f6] pb-1 text-2xl font-bold uppercase leading-[1.3] text-black">Deal giờ vàng</h2>
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
                <div className="w-[230px] shrink-0 snap-start border-r border-[#e5e7eb] last:border-r-0 sm:w-[250px] lg:w-1/5" key={item._id}>
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
      </section> : null}

      {!hasSearchFilter ? <section className="mx-auto max-w-[1600px] border border-[#ededed] bg-white p-6">
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
      </section> : null}

      {!hasSearchFilter ? (managedProductSections.length ? managedProductSections : productSections).map((section) => {
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
      }) : null}

      <section className="mx-auto w-full max-w-[1600px] border border-[#ededed] bg-white p-5">
        <SectionHeader title="Thương hiệu đồng hành" keyword="Brand" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {brands.slice(0, 12).map((item) => (
            <button key={item._id} className={`flex min-h-14 items-center justify-center border px-3 text-center text-sm font-bold transition ${brand === item._id ? "border-[#3278f6] bg-[#eef4ff] text-[#3278f6]" : "border-[#ededed] bg-[#f5f5f5] text-[#29324e] hover:border-[#3278f6] hover:text-[#3278f6]"}`} onClick={() => setBrand(brand === item._id ? "" : item._id)} type="button">
              {item.name}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
