import {
  Check,
  ChevronRight,
  Cpu,
  Fan,
  FileSpreadsheet,
  HardDrive,
  Headphones,
  Keyboard,
  LoaderCircle,
  MemoryStick,
  Monitor,
  Mouse,
  PackageCheck,
  Printer,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { buildPcApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { Product, ProductType } from "@/types";

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

const componentGroups: Array<{
  type: ProductType;
  label: string;
  helper: string;
  required?: boolean;
  icon: typeof Cpu;
}> = [
  { type: "cpu", label: "CPU", helper: "Bộ vi xử lý", required: true, icon: Cpu },
  { type: "mainboard", label: "MAINBOARD", helper: "Bo mạch chủ", required: true, icon: PackageCheck },
  { type: "ram", label: "RAM", helper: "Bộ nhớ trong", required: true, icon: MemoryStick },
  { type: "gpu", label: "VGA", helper: "Card màn hình", required: true, icon: Monitor },
  { type: "ssd", label: "Ổ CỨNG SSD", helper: "Ổ cứng tốc độ cao", required: true, icon: HardDrive },
  { type: "hdd", label: "Ổ CỨNG HDD", helper: "Ổ cứng lưu trữ", icon: HardDrive },
  { type: "psu", label: "NGUỒN", helper: "Bộ nguồn máy tính", required: true, icon: Zap },
  { type: "case", label: "VỎ CASE", helper: "Thùng máy", required: true, icon: PackageCheck },
  { type: "cooler", label: "TẢN NHIỆT", helper: "Làm mát CPU", icon: Fan },
  { type: "monitor", label: "MÀN HÌNH", helper: "Thiết bị hiển thị", icon: Monitor },
  { type: "keyboard", label: "BÀN PHÍM", helper: "Thiết bị ngoại vi", icon: Keyboard },
  { type: "mouse", label: "CHUỘT", helper: "Thiết bị ngoại vi", icon: Mouse },
  { type: "headphone", label: "TAI NGHE", helper: "Thiết bị âm thanh", icon: Headphones },
];

export default function BuildPcPage() {
  const setCart = useCartStore((state) => state.setCart);
  const [selected, setSelected] = useState<Partial<Record<ProductType, Product>>>({});
  const [selectorType, setSelectorType] = useState<ProductType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("Cấu hình PC của tôi");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

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

  const visibleProducts = useMemo(() => {
    const keyword = normalizeSearch(search);
    const filtered = products.filter((product) =>
      !keyword ||
      [
        product.name,
        product.sku,
        product.brand?.name,
        product.category?.name,
        Object.entries(product.specs || {}).map(([key, value]) => `${key} ${String(value)}`).join(" "),
      ].some((value) => normalizeSearch(value).includes(keyword)),
    );
    return [...filtered].sort((first, second) => {
      if (sort === "price_desc") return second.price - first.price;
      if (sort === "rating_desc") return (second.ratingAverage || 0) - (first.ratingAverage || 0);
      return first.price - second.price;
    });
  }, [products, search, sort]);

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
    setLoadingProducts(true);
    setSelectorType(type);
  };

  const closeSelector = () => {
    setSelectorType(null);
    setProducts([]);
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
    setSaving(true);
    try {
      await buildPcApi.save(buildPayload());
      toast.success("Đã lưu cấu hình");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const addCurrentToCart = async () => {
    if (!chosenProducts.length) {
      toast.warning("Hãy chọn ít nhất một linh kiện");
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
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#3278f6]">PC Builder</p><h2 className="mt-1 text-2xl font-black uppercase text-[#1d2939]">Chọn linh kiện PC</h2></div>
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
                      <span className={`grid size-11 shrink-0 place-items-center ${product ? "bg-[#3278f6] text-white" : "bg-[#eef4ff] text-[#3278f6]"}`}>{product ? <Check className="size-5" /> : <Icon className="size-5" />}</span>
                      <div><p className="font-black text-[#344054]">{index + 1}. {group.label}{group.required ? <b className="ml-1 text-[#fb4e4e]">*</b> : null}</p><p className="text-xs text-[#98a2b3]">{group.helper}</p></div>
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
            <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-[#667085]">Tên cấu hình</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setName(event.target.value)} value={name} /></label>
            <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold text-[#667085]">Ghi chú</span><textarea className="min-h-20 w-full border border-[#d0d5dd] p-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setNote(event.target.value)} placeholder="Nhu cầu sử dụng..." value={note} /></label>

            <div className="mt-5 border border-[#e5e7eb]">
              <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 font-black text-[#344054]">Thông tin PC</div>
              <div className="space-y-3 p-4 text-sm">
                <div className="flex justify-between"><span className="text-[#667085]">Linh kiện đã chọn</span><b>{chosenProducts.length}/{componentGroups.length}</b></div>
                <div className="flex justify-between"><span className="text-[#667085]">Linh kiện bắt buộc</span><b>{requiredSelected}/{requiredGroups.length}</b></div>
              </div>
            </div>

            <div className="mt-4 border border-[#e5e7eb] p-4">
              <h4 className="font-black text-[#344054]">Chi phí dự tính</h4>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#667085]">Tạm tính</span><b>{currency.format(subtotal)}</b></div>
                <div className="flex justify-between text-[#15803d]"><span>Khuyến mãi dự kiến</span><b>-{currency.format(promotion)}</b></div>
                <div className="flex items-end justify-between border-t border-[#e5e7eb] pt-4"><span className="font-black text-[#344054]">Tổng chi phí</span><strong className="text-2xl font-black text-[#fb4e4e]">{currency.format(total)}</strong></div>
              </div>
            </div>

            <Button className="mt-4 h-12 w-full rounded-none bg-[#3278f6] font-black hover:bg-[#2860c5]" disabled={!chosenProducts.length || adding} onClick={() => void addCurrentToCart()} type="button">{adding ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-5" />}Tiến hành thanh toán</Button>
            <div className="mt-4 space-y-2 text-xs font-semibold text-[#667085]">
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Hỗ trợ trả góp 0%</p>
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Giao hàng nhanh toàn quốc</p>
              <p className="flex items-center gap-2"><Check className="size-4 text-[#16a34a]" />Hỗ trợ kỹ thuật online</p>
            </div>
          </aside>
        </div>
      </section>

      {selectorType ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#101828]/70 p-3 backdrop-blur-[2px]" onMouseDown={closeSelector}>
          <section className="flex max-h-[94vh] w-full max-w-6xl flex-col bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#3278f6]">Chọn linh kiện mới</p><h2 className="mt-1 text-xl font-black text-[#1d2939]">{selectorGroup?.label} — {selectorGroup?.helper}</h2></div>
              <button className="grid size-10 place-items-center text-[#667085] hover:bg-[#f2f4f7]" onClick={closeSelector} type="button"><X className="size-5" /></button>
            </header>
            <div className="grid gap-3 border-b border-[#e5e7eb] p-4 sm:grid-cols-[minmax(0,1fr)_190px]">
              <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" /><input className="h-11 w-full border border-[#d0d5dd] pl-10 pr-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setSearch(event.target.value)} placeholder={`Tìm ${selectorGroup?.label.toLowerCase()}...`} value={search} /></label>
              <select className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm font-bold text-[#475467]" onChange={(event) => setSort(event.target.value)} value={sort}><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="rating_desc">Đánh giá cao</option></select>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loadingProducts ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="size-9 animate-spin text-[#3278f6]" /></div> : visibleProducts.length ? (
                <div className="grid gap-px bg-[#e5e7eb] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <article className="group flex flex-col bg-white p-3 hover:shadow-[inset_0_0_0_2px_#3278f6]" key={product._id}>
                      <img className="aspect-square w-full object-contain" src={product.images?.[0] || "/icons.svg"} alt={product.name} />
                      <p className="line-clamp-2 min-h-10 text-sm font-bold text-[#344054]">{product.name}</p>
                      <p className="mt-2 text-xs text-[#8d94ac]">{product.brand?.name || "Không thương hiệu"} · Kho {product.stock}</p>
                      <p className="mt-2 text-lg font-black text-[#fb4e4e]">{currency.format(product.price)}</p>
                      <Button className="mt-3 h-10 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" onClick={() => chooseProduct(product)} type="button">Chọn sản phẩm</Button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-80 place-items-center p-8 text-center">
                  <div>
                    <Search className="mx-auto size-9 text-[#98a2b3]" />
                    <h3 className="mt-3 font-black text-[#344054]">
                      {products.length ? "Không tìm thấy linh kiện phù hợp" : `Chưa có sản phẩm loại ${selectorGroup?.label}`}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#8d94ac]">
                      {products.length
                        ? "Hãy thử tìm bằng tên, SKU, thương hiệu hoặc từ khóa không dấu."
                        : `Hãy thêm hoặc import sản phẩm có loại “${selectorType}” trong trang quản trị sản phẩm.`}
                    </p>
                    {search ? <button className="mt-3 text-sm font-bold text-[#3278f6]" onClick={() => setSearch("")} type="button">Xóa từ khóa tìm kiếm</button> : null}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
