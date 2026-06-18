import { CheckCircle2, Save, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { buildPcApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { Product, ProductType } from "@/types";

const productTypes: ProductType[] = ["cpu", "mainboard", "ram", "ssd", "gpu", "psu", "case", "cooler", "monitor"];
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function BuildPcPage() {
  const setCart = useCartStore((state) => state.setCart);
  const [activeType, setActiveType] = useState<ProductType>("cpu");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, Product>>({});
  const [name, setName] = useState("Cấu hình PC của tôi");

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const { data } = await buildPcApi.components(activeType);
        setProducts(data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    void loadComponents();
  }, [activeType]);

  const total = Object.values(selected).reduce((sum, product) => sum + product.price, 0);

  const saveBuild = async () => {
    const components = Object.fromEntries(Object.entries(selected).map(([type, product]) => [type, { product: product._id, quantity: 1 }]));
    try {
      await buildPcApi.save({ name, components });
      toast.success("Đã lưu cấu hình");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const addCurrentToCart = async () => {
    try {
      const { data } = await buildPcApi.save({
        name,
        components: Object.fromEntries(Object.entries(selected).map(([type, product]) => [type, { product: product._id, quantity: 1 }])),
      });
      const buildId = (data.data as { _id?: string })._id;
      if (buildId) {
        const { data: cartData } = await buildPcApi.addToCart(buildId);
        setCart(cartData.data);
      }
      toast.success("Đã thêm cấu hình vào giỏ");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
      <aside className="h-fit overflow-hidden rounded-lg border border-[#ededed] bg-white shadow-sm">
        <div className="bg-[#D91605] px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white">Build PC</div>
        <div className="divide-y divide-[#ededed]">
          {productTypes.map((type) => (
            <button key={type} className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold transition ${activeType === type ? "bg-[#fff5f5] text-[#D91605]" : "text-[#29324e] hover:bg-[#f5f5f5] hover:text-[#D91605]"}`} onClick={() => setActiveType(type)}>
              {type.toUpperCase()}
              {selected[type] ? <CheckCircle2 className="size-4 text-[#D91605]" /> : null}
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="rounded-lg border border-[#ededed] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D91605]">Xây dựng cấu hình PC</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#29324e]">Chọn linh kiện: {activeType.toUpperCase()}</h1>
          <p className="mt-1 text-sm text-[#8d94ac]">Chọn từng nhóm linh kiện và xem tổng chi phí ở cột cấu hình.</p>
        </div>
        <div className="grid gap-3">
          {products.map((product) => (
            <article key={product._id} className="grid gap-3 rounded-lg border border-[#ededed] bg-white p-3 shadow-sm transition hover:border-[#fb4e4e] hover:shadow-md sm:grid-cols-[92px_minmax(0,1fr)_130px] sm:items-center">
              <img className="size-24 rounded-md bg-[#f5f5f5] object-contain sm:size-20" src={product.images?.[0] || "/icons.svg"} alt={product.name} />
              <div className="min-w-0">
                <p className="line-clamp-2 font-bold text-[#29324e]">{product.name}</p>
                <p className="mt-1 text-sm text-[#8d94ac]">{product.brand?.name || "PC Web"} · Kho {product.stock}</p>
                <p className="mt-1 text-lg font-bold text-[#D91605]">{currency.format(product.price)}</p>
              </div>
              <Button className="h-10 rounded-md bg-[#D91605] hover:bg-[#b51204]" onClick={() => setSelected({ ...selected, [activeType]: product })}>Chọn</Button>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-[#ededed] bg-white p-4 shadow-sm lg:sticky lg:top-44">
        <h2 className="text-xl font-bold tracking-tight text-[#29324e]">Cấu hình đang chọn</h2>
        <input className="mt-4 h-10 w-full rounded-md border border-[#ededed] px-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="mt-4 divide-y divide-[#ededed] rounded-md border border-[#ededed]">
          {productTypes.map((type) => (
            <div key={type} className="p-3 text-sm">
              <p className="font-bold text-[#29324e]">{type.toUpperCase()}</p>
              <p className="mt-1 line-clamp-1 text-[#8d94ac]">{selected[type]?.name || "Chưa chọn"}</p>
            </div>
          ))}
        </div>
        <div className="my-4 flex justify-between border-t border-[#ededed] pt-4">
          <span className="text-sm font-bold text-[#8d94ac]">Tổng</span>
          <strong className="text-xl font-bold text-[#D91605]">{currency.format(total)}</strong>
        </div>
        <div className="grid gap-2">
          <Button className="h-10 rounded-md bg-[#D91605] hover:bg-[#b51204]" onClick={() => void saveBuild()}>
            <Save className="size-4" />
            Lưu cấu hình
          </Button>
          <Button variant="outline" className="h-10 rounded-md" onClick={() => void addCurrentToCart()}>
            <ShoppingCart className="size-4" />
            Thêm vào giỏ
          </Button>
        </div>
      </aside>
    </section>
  );
}
