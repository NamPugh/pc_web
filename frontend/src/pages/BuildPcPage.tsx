import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Database,
  Fan,
  FileSpreadsheet,
  HardDrive,
  Headphones,
  History,
  Keyboard,
  LoaderCircle,
  MemoryStick,
  Monitor,
  Mouse,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { buildPcApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import type { PCBuild, Product, ProductType } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const normalizeSearch = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const selectorPriceRanges = [
  { id: "under-3", label: "Dưới 3 triệu", min: 0, max: 3_000_000 },
  { id: "3-8", label: "3 triệu - 8 triệu", min: 3_000_000, max: 8_000_000 },
  { id: "8-15", label: "8 triệu - 15 triệu", min: 8_000_000, max: 15_000_000 },
  { id: "over-15", label: "Trên 15 triệu", min: 15_000_000, max: Number.POSITIVE_INFINITY },
];

const SelectorProductRow = memo(function SelectorProductRow({
  onChoose,
  product,
}: {
  onChoose: (product: Product) => void;
  product: Product;
}) {
  const rating = Math.round(product.ratingAverage || 0);
  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 border-b border-[#eaecf0] px-4 py-4 transition hover:bg-[#f9fbff] sm:grid-cols-[76px_minmax(0,1fr)_170px] sm:items-center">
      <img className="size-[76px] rounded-lg object-contain" src={product.images?.[0] || "/icons.svg"} alt={product.name} loading="lazy" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-bold leading-5 text-[#344054]">{product.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-bold text-[#344054]">Đánh giá</span>
          <span className="flex gap-0.5 text-[#f7b500]">
            {Array.from({ length: 5 }, (_, index) => <Star className={`size-3.5 ${index < rating ? "fill-current" : "fill-[#d7d9df] text-[#d7d9df]"}`} key={index} />)}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#667085]"><b className="text-[#344054]">Tình trạng</b> {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}</p>
      </div>
      <div className="col-start-2 sm:col-start-auto">
        <p className="text-lg font-black text-[#fb4e4e]">{currency.format(product.price)}</p>
        <button className="mt-2 inline-flex h-10 items-center gap-1 rounded-lg bg-[#3278f6] px-4 text-sm font-bold text-white transition hover:bg-[#2860c5]" onClick={() => onChoose(product)} type="button">
          Thêm vào cấu hình <Plus className="size-4" />
        </button>
      </div>
    </article>
  );
});

const componentGroups: Array<{
  type: ProductType;
  label: string;
  helper: string;
  required?: boolean;
  icon: typeof Cpu;
}> = [
  { type: "cpu", label: "CPU", helper: "Bộ vi xử lý", required: true, icon: Cpu },
  { type: "mainboard", label: "MAINBOARD", helper: "Bo mạch chủ", required: true, icon: CircuitBoard },
  { type: "ram", label: "RAM", helper: "Bộ nhớ trong", required: true, icon: MemoryStick },
  { type: "gpu", label: "VGA", helper: "Card màn hình", required: true, icon: Monitor },
  { type: "ssd", label: "Ổ CỨNG SSD", helper: "Ổ cứng tốc độ cao", required: true, icon: HardDrive },
  { type: "hdd", label: "Ổ CỨNG HDD", helper: "Ổ cứng lưu trữ", icon: Database },
  { type: "psu", label: "NGUỒN", helper: "Bộ nguồn máy tính", required: true, icon: Zap },
  { type: "case", label: "VỎ CASE", helper: "Thùng máy", required: true, icon: Package },
  { type: "cooler", label: "TẢN NHIỆT", helper: "Làm mát CPU", required: true, icon: Fan },
  { type: "monitor", label: "MÀN HÌNH", helper: "Thiết bị hiển thị", icon: Monitor },
  { type: "keyboard", label: "BÀN PHÍM", helper: "Thiết bị ngoại vi", icon: Keyboard },
  { type: "mouse", label: "CHUỘT", helper: "Thiết bị ngoại vi", icon: Mouse },
  { type: "headphone", label: "TAI NGHE", helper: "Thiết bị âm thanh", icon: Headphones },
];

export default function BuildPcPage() {
  const setCart = useCartStore((state) => state.setCart);
  const user = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState<Partial<Record<ProductType, Product>>>({});
  const [selectorType, setSelectorType] = useState<ProductType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("Cấu hình PC của tôi");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectorPage, setSelectorPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState<PCBuild[]>([]);
  const [loadingBuilds, setLoadingBuilds] = useState(true);
  const [savedBuildActionId, setSavedBuildActionId] = useState("");

  useEffect(() => {
    if (!selectorType) return;
    let active = true;
    void buildPcApi.components(selectorType)
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.data);
        setLoadingProducts(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
        setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [selectorType]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void buildPcApi.mine()
      .then(({ data }) => {
        if (active) setSavedBuilds(data.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingBuilds(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const visibleProducts = useMemo(() => {
    const keyword = normalizeSearch(search);
    const filtered = products.filter((product) => {
      const matchesKeyword = !keyword || [
        product.name,
        product.sku,
        product.brand?.name,
        product.category?.name,
        Object.entries(product.specs || {}).map(([key, value]) => `${key} ${String(value)}`).join(" "),
      ].some((value) => normalizeSearch(value).includes(keyword));
      if (!matchesKeyword) return false;
      if (selectedBrands.length && (!product.brand || !selectedBrands.includes(product.brand._id))) return false;
      if (selectedPriceRanges.length && !selectedPriceRanges.some((rangeId) => {
        const range = selectorPriceRanges.find((item) => item.id === rangeId);
        return range ? product.price >= range.min && product.price < range.max : true;
      })) return false;
      return true;
    });
    return [...filtered].sort((first, second) => {
      if (sort === "price_desc") return second.price - first.price;
      if (sort === "rating_desc") return (second.ratingAverage || 0) - (first.ratingAverage || 0);
      return first.price - second.price;
    });
  }, [products, search, selectedBrands, selectedPriceRanges, sort]);

  const selectorBrandOptions = useMemo(() => {
    const values = new Map<string, { id: string; name: string; count: number }>();
    products.forEach((product) => {
      if (!product.brand) return;
      const current = values.get(product.brand._id);
      values.set(product.brand._id, { id: product.brand._id, name: product.brand.name, count: (current?.count || 0) + 1 });
    });
    return [...values.values()].sort((a, b) => b.count - a.count);
  }, [products]);

  const selectorPageSize = 8;
  const selectorPageCount = Math.max(Math.ceil(visibleProducts.length / selectorPageSize), 1);
  const pagedProducts = visibleProducts.slice((selectorPage - 1) * selectorPageSize, selectorPage * selectorPageSize);

  const chosenProducts = Object.values(selected).filter((product): product is Product => Boolean(product));
  const subtotal = chosenProducts.reduce((sum, product) => sum + product.price, 0);
  const requiredGroups = componentGroups.filter((group) => group.required);
  const requiredSelected = requiredGroups.filter((group) => selected[group.type]).length;
  const promotion = requiredSelected === requiredGroups.length ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - promotion;

  const buildPayload = () => ({
    name: name.trim() || "Cấu hình PC của tôi",
    note: note.trim(),
    components: Object.fromEntries(
      Object.entries(selected).map(([type, product]) => [type, { product: product!._id, quantity: 1 }]),
    ),
  });

  const openSelector = (type: ProductType) => {
    setProducts([]);
    setSearch("");
    setSort("price_asc");
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setSelectorPage(1);
    setLoadingProducts(true);
    setSelectorType(type);
  };

  const closeSelector = () => {
    setSelectorType(null);
    setProducts([]);
  };

  const toggleSelectorFilter = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setSelectorPage(1);
  };

  const chooseProduct = (product: Product) => {
    if (!selectorType) return;
    setSelected((current) => ({ ...current, [selectorType]: product }));
    closeSelector();
    toast.success(`Đã chọn ${product.name}`);
  };

  const removeProduct = (type: ProductType) => {
    setSelected((current) => {
      const next = { ...current };
      delete next[type];
      return next;
    });
  };

  const resetBuild = () => {
    if (chosenProducts.length && !window.confirm("Toàn bộ linh kiện đã chọn sẽ bị xóa. Tiếp tục?")) return;
    setSelected({});
    setName("Cấu hình PC của tôi");
    setNote("");
  };

  const saveBuild = async () => {
    if (!chosenProducts.length) {
      toast.warning("Hãy chọn ít nhất một linh kiện");
      return;
    }
    if (!selected.cooler) {
      toast.warning("Tản nhiệt là linh kiện bắt buộc");
      return;
    }
    setSaving(true);
    try {
      const { data } = await buildPcApi.save(buildPayload());
      setSavedBuilds((current) => [data.data as PCBuild, ...current]);
      toast.success("Đã lưu cấu hình");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const restoreBuild = (build: PCBuild) => {
    const restored = Object.fromEntries(
      Object.entries(build.components)
        .filter((entry): entry is [string, { product: Product; quantity: number }] => Boolean(entry[1]?.product))
        .map(([type, component]) => [type, component.product]),
    ) as Partial<Record<ProductType, Product>>;
    setSelected(restored);
    setName(build.name);
    setNote(build.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Đã nạp lại cấu hình");
  };

  const addSavedBuildToCart = async (build: PCBuild) => {
    setSavedBuildActionId(build._id);
    try {
      const { data } = await buildPcApi.addToCart(build._id);
      setCart(data.data);
      toast.success("Đã thêm cấu hình vào giỏ hàng");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavedBuildActionId("");
    }
  };

  const removeSavedBuild = async (build: PCBuild) => {
    setSavedBuildActionId(build._id);
    try {
      await buildPcApi.remove(build._id);
      setSavedBuilds((current) => current.filter((item) => item._id !== build._id));
      toast.success("Đã xóa cấu hình");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavedBuildActionId("");
    }
  };

  const addCurrentToCart = async () => {
    if (!chosenProducts.length) {
      toast.warning("Hãy chọn ít nhất một linh kiện");
      return;
    }
    if (!selected.cooler) {
      toast.warning("Tản nhiệt là linh kiện bắt buộc");
      return;
    }
    setAdding(true);
    try {
      const { data } = await buildPcApi.save(buildPayload());
      const buildId = (data.data as { _id?: string })._id;
      if (buildId) {
        const { data: cartData } = await buildPcApi.addToCart(buildId);
        setCart(cartData.data);
      }
      toast.success("Đã thêm cấu hình vào giỏ");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const downloadConfiguration = () => {
    if (!chosenProducts.length) {
      toast.warning("Chưa có linh kiện để tải");
      return;
    }
    const rows = [
      ["Nhóm linh kiện", "Tên sản phẩm", "Giá"],
      ...componentGroups.flatMap((group) => {
        const product = selected[group.type];
        return product ? [[group.label, product.name, String(product.price)]] : [];
      }),
      ["", "Tổng chi phí", String(total)],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cau-hinh-pc.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectorGroup = componentGroups.find((group) => group.type === selectorType);

  return (
    <section className="space-y-5 py-5">
      <nav className="flex items-center gap-2 text-xs font-semibold text-[#8d94ac]">
        <Link className="text-[#3278f6]" to="/">Trang chủ</Link><ChevronRight className="size-3.5" /><span>Build PC - Xây dựng cấu hình PC</span>
      </nav>

      <section className="border border-[#e5e7eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-2xl font-black uppercase text-[#1d2939]">Chọn linh kiện PC</h2>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex h-10 items-center gap-2 border border-[#d0d5dd] px-3 text-xs font-bold text-[#475467] hover:border-[#3278f6] hover:text-[#3278f6]" onClick={() => void saveBuild()} type="button">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Lưu cấu hình</button>
            <button className="inline-flex h-10 items-center gap-2 border border-[#d0d5dd] px-3 text-xs font-bold text-[#475467] hover:border-[#3278f6] hover:text-[#3278f6]" onClick={downloadConfiguration} type="button"><FileSpreadsheet className="size-4" />Tải file cấu hình</button>
            <button className="inline-flex h-10 items-center gap-2 border border-[#d0d5dd] px-3 text-xs font-bold text-[#475467] hover:border-[#3278f6] hover:text-[#3278f6]" onClick={() => window.print()} type="button"><Printer className="size-4" />In báo giá</button>
            <button className="inline-flex h-10 items-center gap-2 border border-[#dc2626] px-3 text-xs font-bold text-[#dc2626] hover:bg-[#fef2f2]" onClick={resetBuild} type="button"><RefreshCw className="size-4" />Làm mới</button>
          </div>
        </header>

        <div className="grid items-start xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="border-r border-[#e5e7eb]">
            <div className="hidden grid-cols-[200px_minmax(0,1fr)_150px_120px] bg-[#29324e] px-4 py-3 text-xs font-black uppercase text-white md:grid">
              <span>Nhóm linh kiện</span><span>Sản phẩm đã chọn</span><span>Đơn giá</span><span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-[#e5e7eb]">
              {componentGroups.map((group, index) => {
                const Icon = group.icon;
                const product = selected[group.type];
                return (
                  <div className="grid gap-3 p-4 md:grid-cols-[200px_minmax(0,1fr)_150px_120px] md:items-center" key={group.type}>
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center ${product ? "text-[#12b76a]" : "text-[#465fff]"}`}>
                        {product ? <Check className="size-6" strokeWidth={2.2} /> : <Icon className="size-6" strokeWidth={1.8} />}
                      </span>
                      <p className="font-black text-[#344054]">{index + 1}. {group.label}{group.required ? <b className="ml-1 text-[#fb4e4e]">*</b> : null}</p>
                    </div>
                    {product ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <img className="size-16 shrink-0 border border-[#e5e7eb] object-contain" src={product.images?.[0] || "/icons.svg"} alt="" />
                        <div className="min-w-0"><Link className="line-clamp-2 text-sm font-bold text-[#344054] hover:text-[#3278f6]" to={`/products/${product._id}`}>{product.name}</Link><p className="mt-1 text-xs text-[#8d94ac]">{product.brand?.name || "Không thương hiệu"} · Kho {product.stock}</p></div>
                      </div>
                    ) : <div aria-hidden="true" />}
                    <strong className={product ? "text-[#fb4e4e]" : "text-[#b0b6c3]"}>{product ? currency.format(product.price) : "0 ₫"}</strong>
                    <div className="flex justify-end gap-1">
                      <button className="h-9 border border-[#3278f6] px-4 text-xs font-black text-[#3278f6] hover:bg-[#eef4ff]" onClick={() => openSelector(group.type)} type="button">{product ? "Thay đổi" : "Chọn"}</button>
                      {product ? <button className="grid size-9 place-items-center border border-[#d0d5dd] text-[#98a2b3] hover:border-[#dc2626] hover:text-[#dc2626]" onClick={() => removeProduct(group.type)} title="Xóa linh kiện" type="button"><Trash2 className="size-4" /></button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="p-5 xl:sticky xl:top-40">
            <h3 className="text-xl font-black uppercase text-[#1d2939]">Xác nhận mua hàng</h3>
            <label className="mt-4 block"><span className="mb-1.5 block text-xs font-black text-[#475467]">Tên cấu hình</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm font-semibold outline-none focus:border-[#3278f6]" onChange={(event) => setName(event.target.value)} value={name} /></label>
            <label className="mt-3 block"><span className="mb-1.5 block text-xs font-black text-[#475467]">Ghi chú</span><textarea className="min-h-20 w-full border border-[#d0d5dd] p-3 text-sm font-medium outline-none focus:border-[#3278f6]" onChange={(event) => setNote(event.target.value)} placeholder="Nhu cầu sử dụng..." value={note} /></label>

            <div className="mt-4 border border-[#e5e7eb] p-4">
              <h4 className="font-black text-[#344054]">Chi phí dự tính</h4>
              <div className="mt-4 space-y-3 text-sm font-semibold">
                <div className="flex justify-between"><span className="font-bold text-[#475467]">Tạm tính</span><b className="font-black">{currency.format(subtotal)}</b></div>
                <div className="flex justify-between font-bold text-[#15803d]"><span>Khuyến mãi dự kiến</span><b className="font-black">-{currency.format(promotion)}</b></div>
                <div className="flex items-end justify-between border-t border-[#e5e7eb] pt-4"><span className="font-black text-[#344054]">Tổng chi phí</span><strong className="text-2xl font-black text-[#fb4e4e]">{currency.format(total)}</strong></div>
              </div>
            </div>

            <Button className="mt-4 h-12 w-full rounded-none bg-[#3278f6] font-black hover:bg-[#2860c5]" disabled={!chosenProducts.length || adding} onClick={() => void addCurrentToCart()} type="button">{adding ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-5" />}Tiến hành thanh toán</Button>
            <div className="mt-4 space-y-2 text-xs font-bold text-[#475467]">
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Hỗ trợ trả góp 0%</p>
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Giao hàng nhanh toàn quốc</p>
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Hỗ trợ kỹ thuật online</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="overflow-hidden border border-[#e5e7eb] bg-white">
        <header className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <History className="size-6 text-[#465fff]" strokeWidth={1.8} />
          <h2 className="text-xl font-black uppercase text-[#1d2939]">Cấu hình đã lưu</h2>
        </header>

        {!user ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#667085]">Đăng nhập để xem và sử dụng lại các cấu hình đã lưu.</p>
            <Button className="mt-4 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" asChild>
              <Link to="/signin">Đăng nhập</Link>
            </Button>
          </div>
        ) : loadingBuilds ? (
          <div className="grid min-h-40 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#3278f6]" /></div>
        ) : savedBuilds.length ? (
          <div className="divide-y divide-[#eaecf0]">
            {savedBuilds.map((build) => {
              const buildProducts = Object.values(build.components).filter((component) => component?.product);
              return (
                <article className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center" key={build._id}>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-[#344054]">{build.name}</h3>
                    <p className="mt-1 text-xs text-[#98a2b3]">
                      {buildProducts.length} linh kiện · Lưu ngày {new Date(build.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="mt-3 flex -space-x-2">
                      {buildProducts.slice(0, 6).map((component, index) => (
                        <img
                          className="size-10 rounded-full border-2 border-white bg-white object-contain shadow-sm"
                          key={`${build._id}-${component!.product._id}-${index}`}
                          src={component!.product.images?.[0] || "/icons.svg"}
                          alt=""
                        />
                      ))}
                      {buildProducts.length > 6 ? <span className="grid size-10 place-items-center rounded-full border-2 border-white bg-[#eef4ff] text-xs font-bold text-[#465fff]">+{buildProducts.length - 6}</span> : null}
                    </div>
                  </div>
                  <strong className="text-lg font-black text-[#fb4e4e]">{currency.format(build.totalPrice)}</strong>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button className="h-10 rounded-none border-[#465fff] text-[#465fff] hover:bg-[#eef4ff]" onClick={() => restoreBuild(build)} type="button" variant="outline">
                      Nạp lại
                    </Button>
                    <Button className="h-10 rounded-none bg-[#465fff] hover:bg-[#3641f5]" disabled={savedBuildActionId === build._id} onClick={() => void addSavedBuildToCart(build)} type="button">
                      {savedBuildActionId === build._id ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
                      Thêm vào giỏ
                    </Button>
                    <button className="grid size-10 place-items-center text-[#d92d20] transition hover:bg-[#fef3f2]" disabled={savedBuildActionId === build._id} onClick={() => void removeSavedBuild(build)} title="Xóa cấu hình" type="button">
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#98a2b3]">Bạn chưa lưu cấu hình PC nào.</div>
        )}
      </section>

      {selectorType ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#101828]/65 p-2 sm:p-4" onMouseDown={closeSelector}>
          <section className="flex max-h-[94vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(16,24,40,0.3)]" onMouseDown={(event) => event.stopPropagation()}>
            <header className="grid shrink-0 items-center gap-4 border-b border-[#eaecf0] px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)_40px]">
              <h2 className="text-xl font-black uppercase text-[#101828]">{selectorGroup?.helper || selectorGroup?.label}</h2>
              <label className="relative">
                <input className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#3278f6] focus:ring-4 focus:ring-[#3278f6]/10" onChange={(event) => { setSearch(event.target.value); setSelectorPage(1); }} placeholder="Nhập sản phẩm cần tìm..." value={search} />
                <span className="absolute right-0 top-0 grid size-11 place-items-center rounded-r-lg bg-[#3278f6] text-white"><Search className="size-5" /></span>
              </label>
              <button className="grid size-10 place-items-center rounded-lg text-[#475467] transition hover:bg-[#f2f4f7]" onClick={closeSelector} type="button"><X className="size-5" /></button>
            </header>

            <div className="grid min-h-0 flex-1 md:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-r border-[#eaecf0] px-5 py-3">
                <div className="border-b border-[#eaecf0] py-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[#98a2b3]"><span>Hãng sản xuất</span><ChevronDown className="size-4" /></div>
                  <div className="mt-4 space-y-3">
                    {selectorBrandOptions.map((brandOption) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={brandOption.id}>
                        <input checked={selectedBrands.includes(brandOption.id)} className="size-4 accent-[#3278f6]" onChange={() => toggleSelectorFilter(selectedBrands, brandOption.id, setSelectedBrands)} type="checkbox" />
                        <span className="min-w-0 flex-1 truncate">{brandOption.name}</span>
                        <span className="text-xs text-[#98a2b3]">[{brandOption.count}]</span>
                      </label>
                    ))}
                    {!selectorBrandOptions.length ? <p className="text-xs text-[#98a2b3]">Chưa có thông tin thương hiệu.</p> : null}
                  </div>
                </div>

                <div className="border-b border-[#eaecf0] py-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[#98a2b3]"><span>Khoảng giá (VNĐ)</span><ChevronDown className="size-4" /></div>
                  <div className="mt-4 space-y-3">
                    {selectorPriceRanges.map((range) => {
                      const count = products.filter((product) => product.price >= range.min && product.price < range.max).length;
                      if (!count) return null;
                      return (
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]" key={range.id}>
                          <input checked={selectedPriceRanges.includes(range.id)} className="size-4 accent-[#3278f6]" onChange={() => toggleSelectorFilter(selectedPriceRanges, range.id, setSelectedPriceRanges)} type="checkbox" />
                          <span className="min-w-0 flex-1">{range.label}</span>
                          <span className="text-xs text-[#98a2b3]">[{count}]</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {(selectedBrands.length || selectedPriceRanges.length || search) ? (
                  <button className="mt-4 text-sm font-bold text-[#3278f6]" onClick={() => { setSelectedBrands([]); setSelectedPriceRanges([]); setSearch(""); setSelectorPage(1); }} type="button">
                    Xóa bộ lọc
                  </button>
                ) : null}
              </aside>

              <div className="flex min-h-0 flex-col">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#eaecf0] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[#98a2b3]">
                    <span>Hiển thị theo:</span>
                    <select className="h-9 rounded-lg border border-[#d0d5dd] bg-white px-3 font-semibold text-[#344054] outline-none focus:border-[#3278f6]" onChange={(event) => { setSort(event.target.value); setSelectorPage(1); }} value={sort}>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="rating_desc">Đánh giá cao</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="grid size-8 place-items-center rounded-md border border-[#eaecf0] text-[#667085] disabled:opacity-40" disabled={selectorPage <= 1} onClick={() => setSelectorPage((page) => Math.max(page - 1, 1))} type="button"><ChevronLeft className="size-4" /></button>
                    {Array.from({ length: Math.min(selectorPageCount, 7) }, (_, index) => {
                      const start = Math.min(Math.max(selectorPage - 3, 1), Math.max(selectorPageCount - 6, 1));
                      const page = start + index;
                      return <button className={`grid size-8 place-items-center rounded-md text-sm font-bold ${page === selectorPage ? "bg-[#101828] text-white" : "bg-[#f2f4f7] text-[#344054] hover:bg-[#e8edff]"}`} key={page} onClick={() => setSelectorPage(page)} type="button">{page}</button>;
                    })}
                    <button className="grid size-8 place-items-center rounded-md border border-[#eaecf0] text-[#667085] disabled:opacity-40" disabled={selectorPage >= selectorPageCount} onClick={() => setSelectorPage((page) => Math.min(page + 1, selectorPageCount))} type="button"><ChevronRight className="size-4" /></button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {loadingProducts ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="size-9 animate-spin text-[#3278f6]" /></div> : pagedProducts.length ? (
                    pagedProducts.map((product) => <SelectorProductRow key={product._id} onChoose={chooseProduct} product={product} />)
                  ) : (
                    <div className="grid min-h-80 place-items-center p-8 text-center">
                      <div>
                        <Search className="mx-auto size-9 text-[#98a2b3]" />
                        <h3 className="mt-3 font-black text-[#344054]">{products.length ? "Không tìm thấy linh kiện phù hợp" : `Chưa có sản phẩm loại ${selectorGroup?.label}`}</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[#8d94ac]">{products.length ? "Hãy thử thay đổi từ khóa hoặc bộ lọc." : `Hãy thêm hoặc import sản phẩm có loại “${selectorType}” trong trang quản trị sản phẩm.`}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
