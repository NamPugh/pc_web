import { Boxes, Layers3, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { adminApi, catalogApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Brand, Category, Product, ProductType } from "@/types";

const productTypes: ProductType[] = ["cpu", "mainboard", "ram", "ssd", "hdd", "gpu", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headphone", "laptop", "pc", "other"];
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function CatalogManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [product, setProduct] = useState({
    name: "",
    price: "",
    stock: "0",
    category: "",
    brand: "",
    productType: "other" as ProductType,
    shortDescription: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, brandResponse, productResponse] = await Promise.all([
        catalogApi.categories(),
        catalogApi.brands(),
        catalogApi.products({ limit: 100, sort: "created_desc" }),
      ]);
      setCategories(categoryResponse.data.data);
      setBrands(brandResponse.data.data);
      setProducts(productResponse.data.data);
      setProduct((current) => ({
        ...current,
        category: current.category || categoryResponse.data.data[0]?._id || "",
        brand: current.brand || brandResponse.data.data[0]?._id || "",
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
      catalogApi.categories(),
      catalogApi.brands(),
      catalogApi.products({ limit: 100, sort: "created_desc" }),
    ]).then(([categoryResponse, brandResponse, productResponse]) => {
      if (!active) return;
      setCategories(categoryResponse.data.data);
      setBrands(brandResponse.data.data);
      setProducts(productResponse.data.data);
      setProduct((current) => ({
        ...current,
        category: current.category || categoryResponse.data.data[0]?._id || "",
        brand: current.brand || brandResponse.data.data[0]?._id || "",
      }));
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

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((item) =>
      [item.name, item.brand?.name, item.category?.name].some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [products, search]);

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createCategory({ name: categoryName.trim(), image: categoryImage.trim() || undefined });
      setCategoryName("");
      setCategoryImage("");
      await loadData();
      toast.success("Đã tạo danh mục");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createBrand({ name: brandName.trim(), logo: brandLogo.trim() || undefined });
      setBrandName("");
      setBrandLogo("");
      await loadData();
      toast.success("Đã tạo thương hiệu");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createProduct({
        name: product.name.trim(),
        price: Number(product.price),
        stock: Number(product.stock),
        category: product.category,
        brand: product.brand || undefined,
        productType: product.productType,
        shortDescription: product.shortDescription.trim(),
      });
      setProduct({
        name: "",
        price: "",
        stock: "0",
        category: categories[0]?._id || "",
        brand: brands[0]?._id || "",
        productType: "other",
        shortDescription: "",
      });
      setShowProductForm(false);
      await loadData();
      toast.success("Đã tạo sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteProduct = async (item: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${item.name}"?`)) return;
    try {
      await adminApi.deleteProduct(item._id);
      await loadData();
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sản phẩm", value: products.length, icon: Boxes, tone: "bg-[#eef4ff] text-[#3278f6]" },
          { label: "Danh mục", value: categories.length, icon: Layers3, tone: "bg-[#f0fdf4] text-[#16a34a]" },
          { label: "Thương hiệu", value: brands.length, icon: UsersRound, tone: "bg-[#f5f3ff] text-[#7c3aed]" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article className="flex items-center gap-4 border border-[#e5e7eb] bg-white p-5" key={item.label}>
              <span className={`grid size-12 place-items-center rounded-lg ${item.tone}`}><Icon className="size-5" /></span>
              <div><p className="text-sm font-semibold text-[#667085]">{item.label}</p><p className="mt-1 text-2xl font-black text-[#1d2939]">{item.value}</p></div>
            </article>
          );
        })}
      </div>

      <section className="border border-[#e5e7eb] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] p-5">
          <div>
            <h2 className="text-xl font-bold text-[#1d2939]">Danh sách sản phẩm</h2>
            <p className="mt-1 text-sm text-[#8d94ac]">Quản lý catalog và tồn kho của cửa hàng.</p>
          </div>
          <Button className="h-10 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" onClick={() => setShowProductForm((current) => !current)}>
            <Plus className="size-4" /> Thêm sản phẩm
          </Button>
          <label className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
            <input className="h-11 w-full border border-[#d0d5dd] pl-10 pr-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm, thương hiệu hoặc danh mục..." value={search} />
          </label>
        </div>

        {showProductForm ? (
          <form className="grid gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={createProduct}>
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm xl:col-span-2" placeholder="Tên sản phẩm" required value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} />
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" placeholder="Giá bán" required type="number" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} />
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" placeholder="Tồn kho" type="number" value={product.stock} onChange={(event) => setProduct({ ...product, stock: event.target.value })} />
            <select className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" required value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })}>
              {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" value={product.brand} onChange={(event) => setProduct({ ...product, brand: event.target.value })}>
              <option value="">Không có thương hiệu</option>
              {brands.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <select className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" value={product.productType} onChange={(event) => setProduct({ ...product, productType: event.target.value as ProductType })}>
              {productTypes.map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
            </select>
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" placeholder="Mô tả ngắn" value={product.shortDescription} onChange={(event) => setProduct({ ...product, shortDescription: event.target.value })} />
            <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-4">
              <Button className="rounded-none" type="button" variant="outline" onClick={() => setShowProductForm(false)}>Hủy</Button>
              <Button className="rounded-none bg-[#3278f6] hover:bg-[#2860c5]">Lưu sản phẩm</Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[minmax(260px,1fr)_150px_130px_130px_60px] bg-[#f9fafb] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              <span>Sản phẩm</span><span>Danh mục</span><span>Giá bán</span><span>Tồn kho</span><span />
            </div>
            <div className="divide-y divide-[#eef0f3]">
              {loading ? <p className="p-10 text-center text-sm text-[#8d94ac]">Đang tải sản phẩm...</p> : filteredProducts.map((item) => (
                <div className="grid grid-cols-[minmax(260px,1fr)_150px_130px_130px_60px] items-center px-5 py-4 text-sm" key={item._id}>
                  <div className="min-w-0"><p className="truncate font-bold text-[#344054]">{item.name}</p><p className="mt-0.5 truncate text-xs text-[#8d94ac]">{item.brand?.name || "Không thương hiệu"} · {item.productType.toUpperCase()}</p></div>
                  <span className="truncate font-semibold text-[#667085]">{item.category?.name || "—"}</span>
                  <strong className="text-[#1d2939]">{currency.format(item.price)}</strong>
                  <span className={`font-bold ${item.stock <= 5 ? "text-[#dc2626]" : "text-[#475467]"}`}>{item.stock} sản phẩm</span>
                  <button className="grid size-9 place-items-center text-[#98a2b3] hover:bg-[#fef2f2] hover:text-[#dc2626]" onClick={() => void deleteProduct(item)} title="Xóa sản phẩm" type="button"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <form className="border border-[#e5e7eb] bg-white p-5" onSubmit={createCategory}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#f0fdf4] text-[#16a34a]"><Layers3 className="size-5" /></span><div><h3 className="font-bold text-[#1d2939]">Thêm danh mục</h3><p className="text-sm text-[#8d94ac]">Nhóm sản phẩm theo loại.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="Tên danh mục" required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="URL ảnh (tùy chọn)" value={categoryImage} onChange={(event) => setCategoryImage(event.target.value)} />
            <Button className="h-11 rounded-none bg-[#3278f6] hover:bg-[#2860c5]">Thêm</Button>
          </div>
        </form>
        <form className="border border-[#e5e7eb] bg-white p-5" onSubmit={createBrand}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#f5f3ff] text-[#7c3aed]"><UsersRound className="size-5" /></span><div><h3 className="font-bold text-[#1d2939]">Thêm thương hiệu</h3><p className="text-sm text-[#8d94ac]">Bổ sung hãng sản xuất.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="Tên thương hiệu" required value={brandName} onChange={(event) => setBrandName(event.target.value)} />
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="URL logo (tùy chọn)" value={brandLogo} onChange={(event) => setBrandLogo(event.target.value)} />
            <Button className="h-11 rounded-none bg-[#3278f6] hover:bg-[#2860c5]">Thêm</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
