import {
  ArrowLeft,
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { cartApi, getErrorMessage, orderApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import type { Cart } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function CartPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setGlobalCart = useCartStore((state) => state.setCart);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");
  const [form, setForm] = useState({
    fullName: user?.userName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  const applyCart = (nextCart: Cart, selectNewItems = false) => {
    setCart(nextCart);
    setGlobalCart(nextCart);
    setSelectedIds((current) => {
      const availableIds = new Set(nextCart.items.map((item) => item.product._id));
      if (selectNewItems) return availableIds;
      return new Set([...current].filter((id) => availableIds.has(id)));
    });
  };

  const refreshCart = async (selectAll = false) => {
    try {
      const { data } = await cartApi.get();
      applyCart(data.data, selectAll);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void cartApi.get()
      .then(({ data }) => {
        if (!active) return;
        setCart(data.data);
        setGlobalCart(data.data);
        setSelectedIds(new Set(data.data.items.map((item) => item.product._id)));
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(getErrorMessage(error));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [setGlobalCart]);

  const selectedItems = useMemo(
    () => cart?.items.filter((item) => selectedIds.has(item.product._id)) || [],
    [cart, selectedIds],
  );
  const selectedQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const selectedTotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const allSelected = Boolean(cart?.items.length) && selectedIds.size === cart?.items.length;

  const toggleItem = (productId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleAll = () => {
    if (!cart) return;
    setSelectedIds(allSelected ? new Set() : new Set(cart.items.map((item) => item.product._id)));
  };

  const updateQuantity = async (productId: string, quantity: number, stock: number) => {
    if (quantity < 1) return;
    if (quantity > stock) {
      toast.warning(`Chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }

    setCart((currentCart) => {
      if (!currentCart) return currentCart;
      const nextItems = currentCart.items.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item,
      );
      const nextCart = {
        ...currentCart,
        items: nextItems,
        totalPrice: nextItems.reduce((total, item) => total + item.price * item.quantity, 0),
      };
      setGlobalCart(nextCart);
      return nextCart;
    });

    try {
      const { data } = await cartApi.update(productId, quantity);
      applyCart(data.data);
    } catch (error) {
      await refreshCart();
      toast.error(getErrorMessage(error));
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const { data } = await cartApi.remove(productId);
      applyCart(data.data);
      toast.success("Đã xóa sản phẩm khỏi giỏ");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeSelected = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Xóa ${selectedIds.size} sản phẩm đã chọn khỏi giỏ hàng?`)) return;

    try {
      let latestCart: Cart | null = null;
      for (const id of selectedIds) {
        const { data } = await cartApi.remove(id);
        latestCart = data.data;
      }
      if (latestCart) applyCart(latestCart);
      toast.success("Đã xóa các sản phẩm được chọn");
    } catch (error) {
      await refreshCart();
      toast.error(getErrorMessage(error));
    }
  };

  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedIds.size) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    setCheckingOut(true);
    try {
      await orderApi.create({
        customerInfo: form,
        paymentMethod,
        selectedProductIds: [...selectedIds],
      });
      await refreshCart();
      setSelectedIds(new Set());
      toast.success(`Đặt thành công ${selectedQuantity} sản phẩm`);
      navigate("/orders");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <section className="space-y-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3278f6]">Giỏ hàng của bạn</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#29324e]">
            Chọn sản phẩm để thanh toán
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            Bạn có thể mua một phần và giữ lại các sản phẩm khác cho lần sau.
          </p>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#3278f6] hover:text-[#2860c5]" to="/">
          <ArrowLeft className="size-4" />
          Tiếp tục mua hàng
        </Link>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#344054]">
              <button
                aria-label="Chọn tất cả sản phẩm"
                className={`grid size-5 place-items-center border transition ${allSelected ? "border-[#3278f6] bg-[#3278f6] text-white" : "border-[#b8c0cc] bg-white"}`}
                onClick={toggleAll}
                type="button"
              >
                {allSelected ? <Check className="size-3.5" /> : null}
              </button>
              Chọn tất cả ({cart?.items.length || 0} sản phẩm)
            </label>
            <button
              className="inline-flex items-center gap-2 text-sm font-bold text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!selectedIds.size}
              onClick={() => void removeSelected()}
              type="button"
            >
              <Trash2 className="size-4" />
              Xóa sản phẩm đã chọn
            </button>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center border border-[#e5e7eb] bg-white">
              <div className="text-center">
                <div className="mx-auto size-9 animate-spin rounded-full border-4 border-[#dbe7ff] border-t-[#3278f6]" />
                <p className="mt-3 text-sm font-semibold text-[#8d94ac]">Đang tải giỏ hàng...</p>
              </div>
            </div>
          ) : !cart?.items.length ? (
            <div className="grid min-h-80 place-items-center border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
              <div>
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#eef4ff] text-[#3278f6]">
                  <ShoppingBag className="size-9" />
                </span>
                <h2 className="mt-5 text-xl font-black text-[#29324e]">Giỏ hàng đang trống</h2>
                <p className="mt-2 text-sm text-[#8d94ac]">Khám phá sản phẩm và thêm món bạn thích vào đây.</p>
                <Button className="mt-5 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" asChild>
                  <Link to="/">Khám phá sản phẩm</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => {
                const selected = selectedIds.has(item.product._id);
                return (
                  <article
                    className={`grid gap-4 border bg-white p-4 shadow-sm transition md:grid-cols-[24px_110px_minmax(0,1fr)_150px_140px_44px] md:items-center ${selected ? "border-[#9cbcff] ring-1 ring-[#3278f6]/10" : "border-[#e5e7eb]"}`}
                    key={item.product._id}
                  >
                    <button
                      aria-label={`Chọn ${item.product.name}`}
                      className={`grid size-5 place-items-center border transition ${selected ? "border-[#3278f6] bg-[#3278f6] text-white" : "border-[#b8c0cc] bg-white"}`}
                      onClick={() => toggleItem(item.product._id)}
                      type="button"
                    >
                      {selected ? <Check className="size-3.5" /> : null}
                    </button>

                    <Link className="grid aspect-square place-items-center overflow-hidden bg-[#f5f7fa] p-2" to={`/products/${item.product._id}`}>
                      <img className="h-full w-full object-contain" src={item.product.images?.[0] || "/icons.svg"} alt={item.product.name} />
                    </Link>

                    <div className="min-w-0">
                      <Link className="line-clamp-2 font-bold leading-6 text-[#29324e] hover:text-[#3278f6]" to={`/products/${item.product._id}`}>
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
                        {item.product.brand?.name || "PC Web"} · {item.product.productType}
                      </p>
                      <p className={`mt-2 text-xs font-bold ${item.product.stock <= 5 ? "text-[#dc2626]" : "text-[#16a34a]"}`}>
                        Còn {item.product.stock} sản phẩm
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#98a2b3] md:hidden">Đơn giá</p>
                      <p className="font-black text-[#3278f6]">{currency.format(item.price)}</p>
                    </div>

                    <div className="inline-flex h-10 w-fit items-center border border-[#d0d5dd] bg-white">
                      <button className="grid size-9 place-items-center text-[#667085] hover:bg-[#f2f4f7]" onClick={() => void updateQuantity(item.product._id, item.quantity - 1, item.product.stock)} type="button">
                        <Minus className="size-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-black text-[#29324e]">{item.quantity}</span>
                      <button className="grid size-9 place-items-center text-[#667085] hover:bg-[#f2f4f7]" onClick={() => void updateQuantity(item.product._id, item.quantity + 1, item.product.stock)} type="button">
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <button className="grid size-10 place-items-center text-[#98a2b3] transition hover:bg-[#fef2f2] hover:text-[#dc2626]" onClick={() => void removeItem(item.product._id)} title="Xóa sản phẩm" type="button">
                      <Trash2 className="size-4" />
                    </button>

                    <div className="border-t border-[#eef0f3] pt-3 md:col-start-3 md:col-end-7 md:flex md:items-center md:justify-between">
                      <span className="text-xs font-semibold text-[#8d94ac]">Thành tiền</span>
                      <strong className="ml-2 text-lg text-[#29324e]">{currency.format(item.price * item.quantity)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Thanh toán an toàn", text: "Thông tin được bảo mật" },
              { icon: Truck, title: "Giao hàng toàn quốc", text: "Theo dõi trạng thái đơn" },
              { icon: PackageCheck, title: "Hàng chính hãng", text: "Bảo hành minh bạch" },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div className="flex items-center gap-3 border border-[#e5e7eb] bg-white p-4" key={benefit.title}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[#3278f6]"><Icon className="size-5" /></span>
                  <div><p className="text-sm font-bold text-[#344054]">{benefit.title}</p><p className="mt-0.5 text-xs text-[#98a2b3]">{benefit.text}</p></div>
                </div>
              );
            })}
          </div>
        </div>

        <form className="border border-[#e5e7eb] bg-white shadow-sm xl:sticky xl:top-44" onSubmit={checkout}>
          <div className="border-b border-[#e5e7eb] p-5">
            <h2 className="text-xl font-black text-[#29324e]">Thông tin đặt hàng</h2>
            <p className="mt-1 text-sm text-[#8d94ac]">Chỉ thanh toán những sản phẩm đã chọn.</p>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3">
              {(["fullName", "phone", "email", "address"] as const).map((field) => (
                <label className="block" key={field}>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#667085]">
                    {field === "fullName" ? "Họ và tên" : field === "phone" ? "Số điện thoại" : field === "email" ? "Email" : "Địa chỉ nhận hàng"}
                  </span>
                  <input
                    className="h-11 w-full border border-[#d0d5dd] px-3 text-sm outline-none transition focus:border-[#3278f6] focus:ring-2 focus:ring-[#3278f6]/10"
                    onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                    required
                    type={field === "email" ? "email" : "text"}
                    value={form[field]}
                  />
                </label>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#667085]">Phương thức thanh toán</p>
              <div className="grid grid-cols-2 gap-2">
                <button className={`border p-3 text-left text-sm font-bold transition ${paymentMethod === "cod" ? "border-[#3278f6] bg-[#eef4ff] text-[#3278f6]" : "border-[#d0d5dd] text-[#667085]"}`} onClick={() => setPaymentMethod("cod")} type="button">
                  COD
                  <small className="mt-1 block font-normal">Khi nhận hàng</small>
                </button>
                <button className={`border p-3 text-left text-sm font-bold transition ${paymentMethod === "banking" ? "border-[#3278f6] bg-[#eef4ff] text-[#3278f6]" : "border-[#d0d5dd] text-[#667085]"}`} onClick={() => setPaymentMethod("banking")} type="button">
                  Chuyển khoản
                  <small className="mt-1 block font-normal">Qua ngân hàng</small>
                </button>
              </div>
            </div>

            <div className="space-y-3 border-y border-[#e5e7eb] py-4 text-sm">
              <div className="flex justify-between text-[#667085]"><span>Đã chọn</span><strong className="text-[#344054]">{selectedQuantity} sản phẩm</strong></div>
              <div className="flex justify-between text-[#667085]"><span>Tạm tính</span><span>{currency.format(selectedTotal)}</span></div>
              <div className="flex justify-between text-[#667085]"><span>Phí vận chuyển</span><span className="font-bold text-[#16a34a]">Miễn phí</span></div>
              <div className="flex items-end justify-between border-t border-dashed border-[#d0d5dd] pt-4">
                <span className="font-bold text-[#29324e]">Tổng thanh toán</span>
                <strong className="text-2xl font-black text-[#3278f6]">{currency.format(selectedTotal)}</strong>
              </div>
            </div>

            <Button className="h-12 w-full rounded-none bg-[#3278f6] text-base font-bold hover:bg-[#2860c5]" disabled={!selectedIds.size || checkingOut}>
              {checkingOut ? "Đang xử lý..." : `Đặt ${selectedQuantity} sản phẩm`}
            </Button>
            {!selectedIds.size ? <p className="text-center text-xs font-semibold text-[#d97706]">Hãy chọn sản phẩm bạn muốn mua.</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
