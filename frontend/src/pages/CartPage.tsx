import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { cartApi, getErrorMessage, orderApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Cart } from "@/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "" });

  const refreshCart = async () => {
    try {
      const { data } = await cartApi.get();
      setCart(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialCart = async () => {
      try {
        const { data } = await cartApi.get();
        if (!ignore) setCart(data.data);
      } catch (error) {
        if (!ignore) toast.error(getErrorMessage(error));
      }
    };

    void loadInitialCart();
    return () => {
      ignore = true;
    };
  }, []);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setCart((currentCart) => {
      if (!currentCart) return currentCart;
      const nextItems = currentCart.items.map((item) => (item.product._id === productId ? { ...item, quantity } : item));
      return { ...currentCart, items: nextItems, totalPrice: nextItems.reduce((total, item) => total + item.price * item.quantity, 0) };
    });

    try {
      await cartApi.update(productId, quantity);
    } catch (error) {
      await refreshCart();
      toast.error(getErrorMessage(error));
    }
  };

  const removeItem = async (productId: string) => {
    setCart((currentCart) => {
      if (!currentCart) return currentCart;
      const nextItems = currentCart.items.filter((item) => item.product._id !== productId);
      return { ...currentCart, items: nextItems, totalPrice: nextItems.reduce((total, item) => total + item.price * item.quantity, 0) };
    });

    try {
      await cartApi.remove(productId);
    } catch (error) {
      await refreshCart();
      toast.error(getErrorMessage(error));
    }
  };

  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await orderApi.create({ customerInfo: form, paymentMethod: "cod" });
      toast.success("Đặt hàng thành công");
      navigate("/orders");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#ededed] bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D91605]">Thanh toán</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#29324e]">Giỏ hàng của bạn</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-[#ededed] bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_120px_130px_130px_50px] bg-[#f5f5f5] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8d94ac] max-md:hidden">
            <span>Sản phẩm</span>
            <span>Đơn giá</span>
            <span>Số lượng</span>
            <span className="text-right">Thành tiền</span>
            <span />
          </div>

          {!cart?.items.length ? (
            <div className="p-10 text-center text-[#8d94ac]">
              <ShoppingBag className="mx-auto mb-3 size-8 text-[#ccc]" />
              Giỏ hàng đang trống. <Link className="font-bold text-[#D91605] hover:underline" to="/">Mua sản phẩm</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#ededed]">
              {cart.items.map((item) => (
                <div key={item.product._id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_120px_130px_130px_50px] md:items-center">
                  <div className="flex min-w-0 gap-3">
                    <img className="size-20 rounded-md bg-[#f5f5f5] object-contain" src={item.product.images?.[0] || "/icons.svg"} alt={item.product.name} />
                    <div className="min-w-0">
                      <Link className="line-clamp-2 font-bold text-[#29324e] hover:text-[#D91605]" to={`/products/${item.product._id}`}>{item.product.name}</Link>
                      <p className="mt-1 text-xs text-[#8d94ac]">{item.product.brand?.name || "PC Web"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#29324e]">{currency.format(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <Button size="icon-sm" variant="outline" onClick={() => void updateQuantity(item.product._id, item.quantity - 1)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button size="icon-sm" variant="outline" onClick={() => void updateQuantity(item.product._id, item.quantity + 1)}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <p className="text-right font-bold text-[#D91605] md:text-left">{currency.format(item.price * item.quantity)}</p>
                  <Button size="icon-sm" variant="ghost" onClick={() => void removeItem(item.product._id)} aria-label={`Xóa ${item.product.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={checkout} className="h-fit rounded-lg border border-[#ededed] bg-white p-4 shadow-sm lg:sticky lg:top-44">
          <h2 className="border-b border-[#ededed] pb-3 text-xl font-bold tracking-tight text-[#29324e]">Thông tin nhận hàng</h2>
          <div className="mt-4 grid gap-3">
            {(["fullName", "phone", "email", "address"] as const).map((field) => (
              <label key={field} className="block text-sm font-bold text-[#29324e]">
                {field === "fullName" ? "Họ tên" : field === "phone" ? "Số điện thoại" : field === "email" ? "Email" : "Địa chỉ"}
                <input className="mt-1 h-10 w-full rounded-md border border-[#ededed] px-3 text-sm font-normal outline-none focus:border-[#D91605]" type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} required />
              </label>
            ))}
          </div>
          <div className="my-4 space-y-2 border-y border-[#ededed] py-4 text-sm">
            <div className="flex justify-between text-[#8d94ac]"><span>Tạm tính</span><span>{currency.format(cart?.totalPrice || 0)}</span></div>
            <div className="flex justify-between text-[#8d94ac]"><span>Vận chuyển</span><span>Liên hệ</span></div>
            <div className="flex justify-between pt-2 text-lg font-bold text-[#29324e]"><span>Tổng tiền</span><span className="text-[#D91605]">{currency.format(cart?.totalPrice || 0)}</span></div>
          </div>
          <Button className="h-11 w-full rounded-md bg-[#D91605] hover:bg-[#b51204]" disabled={!cart?.items.length}>Đặt hàng COD</Button>
          <Button className="mt-2 h-11 w-full rounded-md" variant="outline" asChild>
            <Link to="/">Tiếp tục mua hàng</Link>
          </Button>
        </form>
      </div>
    </section>
  );
}
