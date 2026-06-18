import { CalendarClock, ChevronRight, Flame, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { catalogApi, flashSaleApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { FlashSale, FlashSaleItem, Product } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const toLocalInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const saleState = (sale: FlashSale) => {
  const now = Date.now();
  if (sale.status === "inactive") return { label: "Tạm dừng", tone: "bg-[#f2f4f7] text-[#667085]" };
  if (sale.status === "draft") return { label: "Bản nháp", tone: "bg-[#fff7ed] text-[#c2410c]" };
  if (new Date(sale.startAt).getTime() > now) return { label: "Sắp diễn ra", tone: "bg-[#eff6ff] text-[#1d4ed8]" };
  if (new Date(sale.endAt).getTime() <= now) return { label: "Đã kết thúc", tone: "bg-[#fef2f2] text-[#b91c1c]" };
  return { label: "Đang chạy", tone: "bg-[#f0fdf4] text-[#15803d]" };
};

export default function DealManager() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [search, setSearch] = useState("");
  const [saleForm, setSaleForm] = useState({
    name: "",
    startAt: "",
    endAt: "",
    status: "draft" as FlashSale["status"],
  });
  const [itemForm, setItemForm] = useState({
    productId: "",
    dealPrice: "",
    quantity: "",
  });

  const selectedSale = sales.find((sale) => sale._id === selectedId) || null;

  const loadData = async (preferredId?: string) => {
    setLoading(true);
    try {
      const [saleResponse, productResponse] = await Promise.all([
        flashSaleApi.list(),
        catalogApi.products({ limit: 200, sort: "created_desc" }),
      ]);
      setSales(saleResponse.data.data);
      setProducts(productResponse.data.data);
      const nextId = preferredId || selectedId || saleResponse.data.data[0]?._id || "";
      setSelectedId(nextId);
      setItemForm((current) => ({
        ...current,
        productId: current.productId || productResponse.data.data[0]?._id || "",
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      flashSaleApi.list(),
      catalogApi.products({ limit: 200, sort: "created_desc" }),
    ]).then(([saleResponse, productResponse]) => {
      if (!active) return;
      setSales(saleResponse.data.data);
      setProducts(productResponse.data.data);
      setSelectedId(saleResponse.data.data[0]?._id || "");
      setItemForm((current) => ({ ...current, productId: productResponse.data.data[0]?._id || "" }));
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      toast.error(getErrorMessage(error));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const availableProducts = useMemo(() => {
    const existingIds = new Set(selectedSale?.items.map((item) => item.product._id) || []);
    const keyword = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        (!existingIds.has(product._id) || editingItemId) &&
        (!keyword || product.name.toLowerCase().includes(keyword)),
    );
  }, [editingItemId, products, search, selectedSale]);

  const resetSaleForm = () => {
    setEditingSaleId("");
    setSaleForm({ name: "", startAt: "", endAt: "", status: "draft" });
    setShowSaleForm(false);
  };

  const openCreateSale = () => {
    setEditingSaleId("");
    setSaleForm({ name: "", startAt: "", endAt: "", status: "draft" });
    setShowSaleForm(true);
  };

  const openEditSale = (sale: FlashSale) => {
    setEditingSaleId(sale._id);
    setSaleForm({
      name: sale.name,
      startAt: toLocalInput(sale.startAt),
      endAt: toLocalInput(sale.endAt),
      status: sale.status,
    });
    setShowSaleForm(true);
  };

  const submitSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (new Date(saleForm.endAt) <= new Date(saleForm.startAt)) {
      toast.warning("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    const payload = {
      ...saleForm,
      startAt: new Date(saleForm.startAt).toISOString(),
      endAt: new Date(saleForm.endAt).toISOString(),
    };
    try {
      if (editingSaleId) {
        await flashSaleApi.update(editingSaleId, payload);
        toast.success("Đã cập nhật đợt giảm giá");
        await loadData(editingSaleId);
      } else {
        const { data } = await flashSaleApi.create(payload);
        toast.success("Đã tạo đợt giảm giá");
        await loadData(data.data._id);
      }
      resetSaleForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeSale = async (sale: FlashSale) => {
    if (!window.confirm(`Xóa đợt "${sale.name}" và toàn bộ sản phẩm bên trong?`)) return;
    try {
      await flashSaleApi.remove(sale._id);
      await loadData();
      toast.success("Đã xóa đợt giảm giá");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const resetItemForm = () => {
    setEditingItemId("");
    setItemForm({ productId: products[0]?._id || "", dealPrice: "", quantity: "" });
  };

  const editItem = (item: FlashSaleItem) => {
    setEditingItemId(item._id);
    setItemForm({
      productId: item.product._id,
      dealPrice: String(item.dealPrice),
      quantity: String(item.quantity),
    });
  };

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSale) return;
    const product = products.find((item) => item._id === itemForm.productId);
    if (!product) return;
    if (Number(itemForm.dealPrice) >= product.price) {
      toast.warning("Giá ưu đãi phải thấp hơn giá bán");
      return;
    }
    if (Number(itemForm.quantity) > product.stock) {
      toast.warning("Số suất không được vượt tồn kho");
      return;
    }
    try {
      if (editingItemId) {
        await flashSaleApi.updateItem(selectedSale._id, editingItemId, {
          dealPrice: Number(itemForm.dealPrice),
          quantity: Number(itemForm.quantity),
        });
        toast.success("Đã cập nhật sản phẩm");
      } else {
        await flashSaleApi.addItem(selectedSale._id, {
          productId: itemForm.productId,
          dealPrice: Number(itemForm.dealPrice),
          quantity: Number(itemForm.quantity),
        });
        toast.success("Đã thêm sản phẩm vào đợt");
      }
      resetItemForm();
      await loadData(selectedSale._id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeItem = async (item: FlashSaleItem) => {
    if (!selectedSale || !window.confirm(`Xóa "${item.product.name}" khỏi đợt này?`)) return;
    try {
      await flashSaleApi.removeItem(selectedSale._id, item._id);
      await loadData(selectedSale._id);
      toast.success("Đã xóa sản phẩm khỏi đợt");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border border-[#e5e7eb] bg-white p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ea580c]">Khuyến mãi theo đợt</p>
          <h2 className="mt-1 text-2xl font-black text-[#1d2939]">Quản lý Deal giờ vàng</h2>
          <p className="mt-1 text-sm text-[#8d94ac]">Tạo thời gian cho đợt trước, sau đó quản lý sản phẩm bên trong.</p>
        </div>
        <Button className="rounded-none bg-[#3278f6] hover:bg-[#2860c5]" onClick={openCreateSale}>
          <Plus className="size-4" /> Tạo đợt giảm giá
        </Button>
      </div>

      {showSaleForm ? (
        <form className="grid gap-4 border border-[#cbdcff] bg-[#f8faff] p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_180px_auto]" onSubmit={submitSale}>
          <label><span className="mb-1.5 block text-sm font-bold text-[#344054]">Tên đợt</span><input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setSaleForm({ ...saleForm, name: event.target.value })} placeholder="Ví dụ: Deal cuối tuần" required value={saleForm.name} /></label>
          <label><span className="mb-1.5 block text-sm font-bold text-[#344054]">Bắt đầu</span><input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setSaleForm({ ...saleForm, startAt: event.target.value })} required type="datetime-local" value={saleForm.startAt} /></label>
          <label><span className="mb-1.5 block text-sm font-bold text-[#344054]">Kết thúc</span><input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setSaleForm({ ...saleForm, endAt: event.target.value })} required type="datetime-local" value={saleForm.endAt} /></label>
          <label><span className="mb-1.5 block text-sm font-bold text-[#344054]">Trạng thái</span><select className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setSaleForm({ ...saleForm, status: event.target.value as FlashSale["status"] })} value={saleForm.status}><option value="draft">Bản nháp</option><option value="active">Kích hoạt</option><option value="inactive">Tạm dừng</option></select></label>
          <div className="flex items-end gap-2"><Button className="h-11 rounded-none bg-[#3278f6] hover:bg-[#2860c5]">{editingSaleId ? "Lưu thay đổi" : "Tạo đợt"}</Button><Button className="h-11 rounded-none" onClick={resetSaleForm} type="button" variant="outline"><X className="size-4" /></Button></div>
        </form>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] p-4">
            <h3 className="font-bold text-[#1d2939]">Các đợt giảm giá</h3>
            <p className="mt-1 text-xs text-[#8d94ac]">{sales.length} đợt đã tạo</p>
          </div>
          <div className="max-h-[680px] divide-y divide-[#eef0f3] overflow-y-auto">
            {loading ? <p className="p-6 text-center text-sm text-[#8d94ac]">Đang tải...</p> : sales.length === 0 ? <p className="p-8 text-center text-sm text-[#8d94ac]">Chưa có đợt giảm giá.</p> : sales.map((sale) => {
              const state = saleState(sale);
              return (
                <button className={`w-full p-4 text-left transition ${selectedId === sale._id ? "bg-[#eef4ff]" : "hover:bg-[#f9fafb]"}`} key={sale._id} onClick={() => { setSelectedId(sale._id); resetItemForm(); }} type="button">
                  <div className="flex items-start justify-between gap-2"><p className="font-bold text-[#344054]">{sale.name}</p><ChevronRight className="mt-0.5 size-4 shrink-0 text-[#98a2b3]" /></div>
                  <span className={`mt-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase ${state.tone}`}>{state.label}</span>
                  <p className="mt-2 text-xs leading-5 text-[#8d94ac]">{new Date(sale.startAt).toLocaleString("vi-VN")}<br />đến {new Date(sale.endAt).toLocaleString("vi-VN")}</p>
                  <p className="mt-1 text-xs font-semibold text-[#667085]">{sale.items.length} sản phẩm</p>
                </button>
              );
            })}
          </div>
        </aside>

        {selectedSale ? (
          <div className="space-y-5">
            <section className="border border-[#e5e7eb] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] p-5">
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-lg bg-[#fff7ed] text-[#ea580c]"><CalendarClock className="size-5" /></span><div><h3 className="text-xl font-bold text-[#1d2939]">{selectedSale.name}</h3><p className="text-sm text-[#8d94ac]">{new Date(selectedSale.startAt).toLocaleString("vi-VN")} — {new Date(selectedSale.endAt).toLocaleString("vi-VN")}</p></div></div>
                <div className="flex gap-2"><Button className="rounded-none" onClick={() => openEditSale(selectedSale)} type="button" variant="outline"><Pencil className="size-4" /> Sửa đợt</Button><Button className="rounded-none text-[#dc2626]" onClick={() => void removeSale(selectedSale)} type="button" variant="outline"><Trash2 className="size-4" /></Button></div>
              </div>

              <form className="grid gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] p-5 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_160px_130px_auto]" onSubmit={submitItem}>
                <label className="relative md:col-span-2 xl:col-span-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" /><input className="h-11 w-full border border-[#d0d5dd] bg-white pl-9 pr-3 text-sm" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm..." value={search} /></label>
                <select className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm xl:col-start-1" disabled={Boolean(editingItemId)} onChange={(event) => setItemForm({ ...itemForm, productId: event.target.value })} required value={itemForm.productId}>
                  {editingItemId ? selectedSale.items.filter((item) => item._id === editingItemId).map((item) => <option key={item.product._id} value={item.product._id}>{item.product.name}</option>) : availableProducts.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
                </select>
                <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="1" onChange={(event) => setItemForm({ ...itemForm, dealPrice: event.target.value })} placeholder="Giá ưu đãi" required type="number" value={itemForm.dealPrice} />
                <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="1" onChange={(event) => setItemForm({ ...itemForm, quantity: event.target.value })} placeholder="Số suất" required type="number" value={itemForm.quantity} />
                <div className="flex gap-2"><Button className="h-11 flex-1 rounded-none bg-[#3278f6] hover:bg-[#2860c5]">{editingItemId ? "Cập nhật" : "Thêm sản phẩm"}</Button>{editingItemId ? <Button className="h-11 rounded-none" onClick={resetItemForm} type="button" variant="outline"><X className="size-4" /></Button> : null}</div>
              </form>

              <div className="overflow-x-auto">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-[minmax(280px,1fr)_150px_150px_150px_90px] bg-[#f9fafb] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]"><span>Sản phẩm</span><span>Giá gốc</span><span>Giá deal</span><span>Đã bán / Số suất</span><span /></div>
                  <div className="divide-y divide-[#eef0f3]">
                    {selectedSale.items.length === 0 ? <div className="p-12 text-center"><Flame className="mx-auto size-9 text-[#fdba74]" /><p className="mt-3 font-bold text-[#475467]">Chưa có sản phẩm trong đợt này</p><p className="mt-1 text-sm text-[#98a2b3]">Dùng form phía trên để thêm sản phẩm đầu tiên.</p></div> : selectedSale.items.map((item) => (
                      <div className="grid grid-cols-[minmax(280px,1fr)_150px_150px_150px_90px] items-center gap-3 px-5 py-4 text-sm" key={item._id}>
                        <div className="flex min-w-0 items-center gap-3"><div className="grid size-14 shrink-0 place-items-center bg-[#f5f7fa] p-1">{item.product.images?.[0] ? <img className="h-full w-full object-contain" src={item.product.images[0]} alt={item.product.name} /> : null}</div><div className="min-w-0"><p className="truncate font-bold text-[#344054]">{item.product.name}</p><p className="mt-1 text-xs text-[#98a2b3]">Kho {item.product.stock}</p></div></div>
                        <span className="text-[#667085] line-through">{currency.format(item.product.price)}</span>
                        <strong className="text-[#ea580c]">{currency.format(item.dealPrice)}</strong>
                        <div><p className="font-bold text-[#344054]">{item.sold} / {item.quantity}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]"><div className="h-full bg-[#3278f6]" style={{ width: `${Math.min((item.sold / item.quantity) * 100, 100)}%` }} /></div></div>
                        <div className="flex justify-end gap-1"><button className="grid size-9 place-items-center text-[#3278f6] hover:bg-[#eef4ff]" onClick={() => editItem(item)} type="button"><Pencil className="size-4" /></button><button className="grid size-9 place-items-center text-[#dc2626] hover:bg-[#fef2f2]" onClick={() => void removeItem(item)} type="button"><Trash2 className="size-4" /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center border border-dashed border-[#d0d5dd] bg-white text-center"><div><CalendarClock className="mx-auto size-10 text-[#98a2b3]" /><p className="mt-3 font-bold text-[#475467]">Hãy tạo hoặc chọn một đợt giảm giá</p></div></div>
        )}
      </div>
    </div>
  );
}
