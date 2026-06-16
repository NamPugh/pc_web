import { BadgePlus, Boxes, Layers3, Search, ShieldCheck, Sparkles, Trash2, Truck, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { adminApi, catalogApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Brand, Category, Product, ProductType } from "@/types";

const productTypes: ProductType[] = ["cpu", "mainboard", "ram", "ssd", "hdd", "gpu", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headphone", "laptop", "pc", "other"];
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const statConfig = [
  { label: "Danh mục", icon: Layers3, tone: "from-[#d71920] to-[#111111]" },
  { label: "Thương hiệu", icon: UsersRound, tone: "from-[#111111] to-[#2b2b2b]" },
  { label: "Sản phẩm", icon: Boxes, tone: "from-[#1f2937] to-[#d71920]" },
  { label: "Giao diện", icon: Sparkles, tone: "from-[#7f1118] to-[#111111]" },
];

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
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

  const loadCategories = async () => {
    const { data } = await catalogApi.categories();
    setCategories(data.data);
    setProduct((current) => ({ ...current, category: current.category || data.data[0]?._id || "" }));
  };

  const loadBrands = async () => {
    const { data } = await catalogApi.brands();
    setBrands(data.data);
    setProduct((current) => ({ ...current, brand: current.brand || data.data[0]?._id || "" }));
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await catalogApi.products({ limit: 12, sort: "created_desc" });
      setProducts(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadBrands();
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((item) => item.name.toLowerCase().includes(keyword) || item.brand?.name?.toLowerCase().includes(keyword));
  }, [products, search]);

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createCategory({ name: categoryName, image: categoryImage || undefined });
      setCategoryName("");
      setCategoryImage("");
      await loadCategories();
      toast.success("Đã tạo danh mục");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createBrand({ name: brandName, logo: brandLogo || undefined });
      setBrandName("");
      setBrandLogo("");
      await loadBrands();
      toast.success("Đã tạo thương hiệu");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await adminApi.createProduct({
        name: product.name,
        price: Number(product.price),
        stock: Number(product.stock),
        category: product.category,
        brand: product.brand || undefined,
        productType: product.productType,
        shortDescription: product.shortDescription,
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
      await loadProducts();
      toast.success("Đã tạo sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await adminApi.deleteProduct(id);
      await loadProducts();
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const stats = [
    { label: "Danh mục", value: categories.length, icon: Layers3 },
    { label: "Thương hiệu", value: brands.length, icon: UsersRound },
    { label: "Sản phẩm", value: products.length, icon: Boxes },
    { label: "Quản trị", value: "Admin", icon: ShieldCheck },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#111111] text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              <BadgePlus className="size-4" />
              Admin dashboard
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Quản trị hệ thống</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">Trang quản lý chuyên nghiệp cho cửa hàng công nghệ</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Quản lý danh mục, thương hiệu và sản phẩm trong một bố cục rõ ràng hơn: có thống kê, danh sách dữ liệu và form tạo nhanh theo một ngôn ngữ giao diện thống nhất.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {statConfig.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-lg bg-gradient-to-br ${item.tone} p-4 shadow-lg shadow-black/15`}>
                  <Icon className="size-5 text-white/90" />
                  <p className="mt-3 text-sm font-semibold text-white/80">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{stat.value}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-md bg-red-50 text-[#d71920]">
                  <Icon className="size-5" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d71920]">Quản lý dữ liệu</p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Danh mục, thương hiệu, sản phẩm</h2>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-11 w-full rounded-md border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-[#d71920]"
                  placeholder="Tìm sản phẩm trong dashboard"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <span>Sản phẩm</span>
                <span>Giá</span>
                <span>Kho</span>
                <span className="text-right">Thao tác</span>
              </div>
              <div className="divide-y divide-slate-100">
                {loadingProducts ? (
                  <div className="p-6 text-center text-sm text-slate-500">Đang tải sản phẩm...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">Không có sản phẩm phù hợp.</div>
                ) : (
                  filteredProducts.map((item) => (
                    <div key={item._id} className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr] items-center px-4 py-4 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{item.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {item.brand?.name || "No brand"} · {item.category?.name || "No category"}
                        </p>
                      </div>
                      <span className="font-semibold text-[#d71920]">{currency.format(item.price)}</span>
                      <span className="text-slate-600">{item.stock}</span>
                      <div className="flex justify-end">
                        <Button size="icon-sm" variant="ghost" onClick={() => void deleteProduct(item._id)} aria-label={`Xóa ${item.name}`}>
                          <Trash2 className="size-4 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={createCategory} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="grid size-10 place-items-center rounded-md bg-red-50 text-[#d71920]">
                  <Layers3 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">Danh mục</h3>
                  <p className="text-sm text-slate-500">Tạo danh mục mới</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Tên danh mục" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
                <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Link ảnh danh mục (tuỳ chọn)" value={categoryImage} onChange={(event) => setCategoryImage(event.target.value)} />
                <Button className="h-11 w-full rounded-md bg-[#d71920] hover:bg-[#b80d18]">Tạo danh mục</Button>
              </div>
            </form>

            <form onSubmit={createBrand} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="grid size-10 place-items-center rounded-md bg-red-50 text-[#d71920]">
                  <UsersRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">Thương hiệu</h3>
                  <p className="text-sm text-slate-500">Tạo thương hiệu mới</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Tên thương hiệu" value={brandName} onChange={(event) => setBrandName(event.target.value)} required />
                <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Logo URL (tuỳ chọn)" value={brandLogo} onChange={(event) => setBrandLogo(event.target.value)} />
                <Button className="h-11 w-full rounded-md bg-[#d71920] hover:bg-[#b80d18]">Tạo thương hiệu</Button>
              </div>
            </form>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={createProduct} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-md bg-red-50 text-[#d71920]">
                <Truck className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-950">Tạo sản phẩm</h3>
                <p className="text-sm text-slate-500">Nội dung đầu vào cho catalog</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <input className="h-11 rounded-md border border-slate-200 px-3 text-sm" placeholder="Tên sản phẩm" value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-11 rounded-md border border-slate-200 px-3 text-sm" placeholder="Giá" type="number" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} required />
                <input className="h-11 rounded-md border border-slate-200 px-3 text-sm" placeholder="Tồn kho" type="number" value={product.stock} onChange={(event) => setProduct({ ...product, stock: event.target.value })} />
              </div>
              <select className="h-11 rounded-md border border-slate-200 px-3 text-sm" value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })} required>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select className="h-11 rounded-md border border-slate-200 px-3 text-sm" value={product.brand} onChange={(event) => setProduct({ ...product, brand: event.target.value })}>
                <option value="">Chọn thương hiệu</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <select className="h-11 rounded-md border border-slate-200 px-3 text-sm" value={product.productType} onChange={(event) => setProduct({ ...product, productType: event.target.value as ProductType })}>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea className="min-h-24 rounded-md border border-slate-200 p-3 text-sm" placeholder="Mô tả ngắn" value={product.shortDescription} onChange={(event) => setProduct({ ...product, shortDescription: event.target.value })} />
              <Button className="h-11 rounded-md bg-[#d71920] hover:bg-[#b80d18]">Tạo sản phẩm</Button>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight text-slate-950">Danh sách nhanh</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Tổng danh mục: {categories.length}</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Tổng thương hiệu: {brands.length}</div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Sản phẩm đang hiển thị: {filteredProducts.length}</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
