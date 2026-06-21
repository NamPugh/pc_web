import { Check, Grid2X2, LoaderCircle, Package, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { adminApi, catalogApi, getErrorMessage } from "@/api/client";
import AdminSelect from "@/components/admin/AdminSelect";
import { Button } from "@/components/ui/button";
import ProductExcelImporter from "@/components/admin/ProductExcelImporter";
import type { Brand, Category, Product, ProductType } from "@/types";

const productTypes: ProductType[] = ["cpu", "mainboard", "ram", "ssd", "hdd", "gpu", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headphone", "laptop", "pc", "other"];
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
type ProductForm = {
  name: string;
  sku: string;
  price: string;
  oldPrice: string;
  stock: string;
  category: string;
  brand: string;
  productType: ProductType;
  status: NonNullable<Product["status"]>;
  description: string;
  images: string;
  specs: string;
  isFeatured: boolean;
  isDeal: boolean;
  dealPrice: string;
  dealStartAt: string;
  dealEndAt: string;
  dealQuantity: string;
  dealSold: string;
  ratingAverage: string;
  ratingCount: string;
  sold: string;
};

const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const emptyProductForm = (category = ""): ProductForm => ({
  name: "",
  sku: "",
  price: "",
  oldPrice: "",
  stock: "0",
  category,
  brand: "",
  productType: "other",
  status: "active",
  description: "",
  images: "",
  specs: "{}",
  isFeatured: false,
  isDeal: false,
  dealPrice: "",
  dealStartAt: "",
  dealEndAt: "",
  dealQuantity: "0",
  dealSold: "0",
  ratingAverage: "0",
  ratingCount: "0",
  sold: "0",
});

export default function CatalogManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [product, setProduct] = useState<ProductForm>(emptyProductForm());
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const specsRef = useRef<HTMLTextAreaElement>(null);
  const imagesRef = useRef<HTMLTextAreaElement>(null);

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item._id, label: item.name })),
    [categories],
  );
  const brandOptions = useMemo(
    () => [{ value: "none", label: "Không có thương hiệu" }, ...brands.map((item) => ({ value: item._id, label: item.name }))],
    [brands],
  );
  const productTypeOptions = useMemo(
    () => productTypes.map((type) => ({ value: type, label: type.toUpperCase() })),
    [],
  );
  const productStatusOptions = useMemo(
    () => [{ value: "active", label: "Đang bán" }, { value: "inactive", label: "Ngừng bán" }, { value: "out_of_stock", label: "Hết hàng" }],
    [],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, brandResponse, productResponse] = await Promise.all([
        catalogApi.categories(),
        catalogApi.brands(),
        catalogApi.products({ limit: 500, sort: "created_desc" }),
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
      catalogApi.products({ limit: 500, sort: "created_desc" }),
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
      const { data } = await adminApi.createCategory({ name: categoryName.trim(), image: categoryImage.trim() || undefined });
      setCategories((current) => [data.data, ...current]);
      setProduct((current) => ({ ...current, category: current.category || data.data._id }));
      setCategoryName("");
      setCategoryImage("");
      toast.success("Đã tạo danh mục");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await adminApi.createBrand({ name: brandName.trim(), logo: brandLogo.trim() || undefined });
      setBrands((current) => [data.data, ...current]);
      setBrandName("");
      setBrandLogo("");
      toast.success("Đã tạo thương hiệu");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const resetProductForm = () => {
    setEditingId("");
    setProduct(emptyProductForm(categories[0]?._id || ""));
    setShowProductForm(false);
  };

  const openNewProduct = () => {
    resetProductForm();
    setShowProductForm(true);
  };

  const editProduct = (item: Product) => {
    setEditingId(item._id);
    setProduct({
      name: item.name,
      sku: item.sku || "",
      price: String(item.price),
      oldPrice: item.oldPrice ? String(item.oldPrice) : "",
      stock: String(item.stock ?? 0),
      category: item.category?._id || categories[0]?._id || "",
      brand: item.brand?._id || "",
      productType: item.productType,
      status: item.status || "active",
      description: item.description || "",
      images: (item.images || []).join("\n"),
      specs: JSON.stringify(item.specs || {}, null, 2),
      isFeatured: Boolean(item.isFeatured),
      isDeal: Boolean(item.isDeal),
      dealPrice: item.dealPrice ? String(item.dealPrice) : "",
      dealStartAt: toLocalDateTime(item.dealStartAt),
      dealEndAt: toLocalDateTime(item.dealEndAt),
      dealQuantity: String(item.dealQuantity || 0),
      dealSold: String(item.dealSold || 0),
      ratingAverage: String(item.ratingAverage || 0),
      ratingCount: String(item.ratingCount || 0),
      sold: String(item.sold || 0),
    });
    setShowProductForm(false);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProduct(true);
    const wasEditing = Boolean(editingId);
    try {
      const descriptionValue = editingId ? descriptionRef.current?.value ?? product.description : product.description;
      const specsValue = editingId ? specsRef.current?.value ?? product.specs : product.specs;
      const imagesValue = editingId ? imagesRef.current?.value ?? product.images : product.images;
      let specs: Record<string, unknown> = {};
      try {
        specs = specsValue.trim() ? JSON.parse(specsValue) as Record<string, unknown> : {};
      } catch {
        toast.error("Thông số kỹ thuật phải là JSON hợp lệ");
        return;
      }
      const payload = {
        name: product.name.trim(),
        sku: product.sku.trim() || undefined,
        price: Number(product.price),
        oldPrice: Number(product.oldPrice) || 0,
        stock: Number(product.stock),
        category: product.category,
        brand: product.brand || undefined,
        productType: product.productType,
        status: product.status,
        description: descriptionValue.trim(),
        specs,
        isFeatured: product.isFeatured,
        isDeal: product.isDeal,
        dealPrice: Number(product.dealPrice) || 0,
        dealStartAt: product.dealStartAt ? new Date(product.dealStartAt).toISOString() : null,
        dealEndAt: product.dealEndAt ? new Date(product.dealEndAt).toISOString() : null,
        dealQuantity: Number(product.dealQuantity) || 0,
        dealSold: Number(product.dealSold) || 0,
        ratingAverage: Number(product.ratingAverage) || 0,
        ratingCount: Number(product.ratingCount) || 0,
        sold: Number(product.sold) || 0,
        images: imagesValue
          .split(/[|;\n]+/)
          .map((image) => image.trim())
          .filter(Boolean),
      };
      if (editingId) {
        const { data } = await adminApi.updateProduct(editingId, payload);
        setProducts((current) => current.map((item) => item._id === editingId ? data.data : item));
      } else {
        const { data } = await adminApi.createProduct(payload);
        setProducts((current) => [data.data, ...current]);
      }
      resetProductForm();
      toast.success(wasEditing ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (item: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${item.name}"?`)) return;
    try {
      await adminApi.deleteProduct(item._id);
      setProducts((current) => current.filter((productItem) => productItem._id !== item._id));
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteAllProducts = async () => {
    if (!products.length) return;
    const confirmation = window.prompt(
      `Thao tác này sẽ xóa toàn bộ sản phẩm và gỡ chúng khỏi giỏ hàng, flash sale, danh mục trang chủ.\nNhập "XOA TAT CA" để xác nhận:`,
    );
    if (confirmation !== "XOA TAT CA") {
      if (confirmation !== null) toast.error("Nội dung xác nhận không đúng");
      return;
    }

    setDeletingAll(true);
    try {
      const { data } = await adminApi.deleteAllProducts();
      resetProductForm();
      setProducts([]);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sản phẩm", value: products.length, icon: Package },
          { label: "Danh mục", value: categories.length, icon: Grid2X2 },
          { label: "Thương hiệu", value: brands.length, icon: Tags },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article className="flex items-center gap-4 border border-[#e5e7eb] bg-white p-5" key={item.label}>
              <Icon className="size-8 shrink-0 text-[#465fff]" strokeWidth={1.8} />
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
          <div className="flex flex-wrap gap-2">
            <ProductExcelImporter brands={brands} categories={categories} onImported={loadData} products={products} />
            <Button className="h-10 rounded-none border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2]" disabled={!products.length || deletingAll} onClick={() => void deleteAllProducts()} type="button" variant="outline">
              {deletingAll ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Xóa toàn bộ
            </Button>
            <Button className="h-10 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" onClick={openNewProduct}>
              <Plus className="size-4" /> Thêm sản phẩm
            </Button>
          </div>
          <label className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
            <input className="h-11 w-full border border-[#d0d5dd] pl-10 pr-3 text-sm outline-none focus:border-[#3278f6]" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm, thương hiệu hoặc danh mục..." value={search} />
          </label>
        </div>

        {showProductForm ? (
          <form className="grid gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] p-5 md:grid-cols-2 xl:grid-cols-4" id="product-form" onSubmit={saveProduct}>
            <div className="flex items-center justify-between md:col-span-2 xl:col-span-4">
              <div>
                <h3 className="font-black text-[#344054]">{editingId ? "Sửa nhanh sản phẩm" : "Thêm sản phẩm mới"}</h3>
                <p className="text-xs text-[#8d94ac]">{editingId ? "Cập nhật các thông tin cần thiết rồi lưu thay đổi." : "Nhập thông tin cơ bản của sản phẩm."}</p>
              </div>
              {editingId ? <span className="bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#3278f6]">Đang chỉnh sửa</span> : null}
            </div>
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm xl:col-span-2" placeholder="Tên sản phẩm" required value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} />
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" placeholder="Giá bán" required type="number" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} />
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" placeholder="Giá cũ (tùy chọn)" type="number" value={product.oldPrice} onChange={(event) => setProduct({ ...product, oldPrice: event.target.value })} />
            <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" placeholder="Tồn kho" type="number" value={product.stock} onChange={(event) => setProduct({ ...product, stock: event.target.value })} />
            <AdminSelect options={categoryOptions} onValueChange={(category) => setProduct({ ...product, category })} value={product.category} />
            <AdminSelect options={brandOptions} onValueChange={(brand) => setProduct({ ...product, brand: brand === "none" ? "" : brand })} value={product.brand || "none"} />
            <AdminSelect options={productTypeOptions} onValueChange={(productType) => setProduct({ ...product, productType: productType as ProductType })} value={product.productType} />
            <AdminSelect options={productStatusOptions} onValueChange={(status) => setProduct({ ...product, status: status as ProductForm["status"] })} value={product.status} />
            <textarea className="min-h-24 border border-[#d0d5dd] bg-white p-3 text-sm md:col-span-2 xl:col-span-4" onChange={(event) => setProduct({ ...product, description: event.target.value })} placeholder="Mô tả chi tiết sản phẩm" value={product.description} />
            <textarea
              className="min-h-24 border border-[#d0d5dd] bg-white p-3 text-sm md:col-span-2 xl:col-span-4"
              onChange={(event) => setProduct({ ...product, images: event.target.value })}
              placeholder={"Danh sách URL ảnh, mỗi ảnh một dòng\nhttps://.../anh-chinh.jpg\nhttps://.../anh-phu.jpg"}
              value={product.images}
            />
            {product.images.trim() ? (
              <div className="flex gap-2 overflow-x-auto md:col-span-2 xl:col-span-4">
                {product.images.split(/[|;\n]+/).map((image) => image.trim()).filter(Boolean).slice(0, 8).map((image, index) => (
                  <div className="grid size-20 shrink-0 place-items-center border border-[#d0d5dd] bg-white p-1" key={`${image}-${index}`}>
                    <img className="h-full w-full object-contain" src={image} alt={`Xem trước ảnh ${index + 1}`} />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-4">
              <Button className="rounded-none" disabled={savingProduct} type="button" variant="outline" onClick={resetProductForm}>Hủy</Button>
              <Button className="rounded-none bg-[#3278f6] hover:bg-[#2860c5]" disabled={savingProduct}>
                {savingProduct ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {editingId ? "Lưu thay đổi" : "Lưu sản phẩm"}
              </Button>
            </div>
          </form>
        ) : null}

        {editingId ? (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-[#101828]/65 p-3" onMouseDown={resetProductForm}>
            <form className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveProduct}>
              <header className="z-20 flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-4">
                <div>
                  <h2 className="text-xl font-black text-[#1d2939]">{product.name}</h2>
                </div>
                <button className="grid size-10 place-items-center text-[#667085] hover:bg-[#f2f4f7]" disabled={savingProduct} onClick={resetProductForm} type="button"><X className="size-5" /></button>
              </header>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 [scrollbar-gutter:stable]">
                <section className="rounded-xl border border-[#e5e7eb] p-4">
                  <h3 className="mb-4 font-black text-[#344054]">Thông tin cơ bản</h3>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="md:col-span-2"><span className="mb-1 block text-xs font-bold text-[#667085]">Tên sản phẩm</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" onChange={(event) => setProduct({ ...product, name: event.target.value })} required value={product.name} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">SKU</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" onChange={(event) => setProduct({ ...product, sku: event.target.value })} value={product.sku} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Loại sản phẩm</span><AdminSelect className="w-full" options={productTypeOptions} onValueChange={(productType) => setProduct({ ...product, productType: productType as ProductType })} value={product.productType} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Danh mục</span><AdminSelect className="w-full" options={categoryOptions} onValueChange={(category) => setProduct({ ...product, category })} value={product.category} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Thương hiệu</span><AdminSelect className="w-full" options={brandOptions} onValueChange={(brand) => setProduct({ ...product, brand: brand === "none" ? "" : brand })} value={product.brand || "none"} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Trạng thái</span><AdminSelect className="w-full" options={productStatusOptions} onValueChange={(status) => setProduct({ ...product, status: status as ProductForm["status"] })} value={product.status} /></label>
                    <label className="flex items-end">
                      <span className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-bold transition ${product.isFeatured ? "border-[#465fff] bg-[#ecf3ff] text-[#465fff]" : "border-[#d0d5dd] bg-white text-[#475467] hover:border-[#b8c4ff]"}`}>
                        <input checked={product.isFeatured} className="peer sr-only" onChange={(event) => setProduct({ ...product, isFeatured: event.target.checked })} type="checkbox" />
                        <span className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${product.isFeatured ? "border-[#465fff] bg-[#465fff] text-white" : "border-[#98a2b3] bg-white text-transparent"}`}><Check className="size-3.5" strokeWidth={3} /></span>
                        Sản phẩm nổi bật
                      </span>
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border border-[#e5e7eb] p-4">
                  <h3 className="mb-4 font-black text-[#344054]">Giá, kho và thống kê</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Giá bán</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, price: event.target.value })} required type="number" value={product.price} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Giá cũ</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, oldPrice: event.target.value })} type="number" value={product.oldPrice} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Tồn kho</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, stock: event.target.value })} type="number" value={product.stock} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Đã bán</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, sold: event.target.value })} type="number" value={product.sold} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Điểm đánh giá</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" max="5" min="0" onChange={(event) => setProduct({ ...product, ratingAverage: event.target.value })} step="0.1" type="number" value={product.ratingAverage} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Số lượt đánh giá</span><input className="h-11 w-full border border-[#d0d5dd] px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, ratingCount: event.target.value })} type="number" value={product.ratingCount} /></label>
                  </div>
                </section>

                <section className="rounded-xl border border-[#e5e7eb] p-4">
                  <h3 className="mb-4 font-black text-[#344054]">Nội dung và hình ảnh</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Mô tả sản phẩm</span><textarea className="min-h-48 w-full border border-[#d0d5dd] p-3 text-sm" defaultValue={product.description} ref={descriptionRef} /></label>
                    <label><span className="mb-1 block text-xs font-bold text-[#667085]">Thông số kỹ thuật (JSON)</span><textarea className="min-h-48 w-full border border-[#d0d5dd] p-3 font-mono text-xs" defaultValue={product.specs} ref={specsRef} /></label>
                    <label className="lg:col-span-2"><span className="mb-1 block text-xs font-bold text-[#667085]">Danh sách URL ảnh — mỗi ảnh một dòng</span><textarea className="min-h-28 w-full border border-[#d0d5dd] p-3 text-sm" defaultValue={product.images} ref={imagesRef} /></label>
                  </div>
                </section>

                <section className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-4">
                  <label className="inline-flex cursor-pointer items-center gap-3 font-black text-[#9a3412]">
                    <input checked={product.isDeal} className="sr-only" onChange={(event) => setProduct({ ...product, isDeal: event.target.checked })} type="checkbox" />
                    <span className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${product.isDeal ? "border-[#ea580c] bg-[#ea580c] text-white" : "border-[#fdba74] bg-white text-transparent"}`}><Check className="size-3.5" strokeWidth={3} /></span>
                    Cấu hình Deal trực tiếp trên sản phẩm
                  </label>
                  {product.isDeal ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label><span className="mb-1 block text-xs font-bold text-[#9a3412]">Giá deal</span><input className="h-11 w-full border border-[#fdba74] bg-white px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, dealPrice: event.target.value })} type="number" value={product.dealPrice} /></label><label><span className="mb-1 block text-xs font-bold text-[#9a3412]">Số lượng deal</span><input className="h-11 w-full border border-[#fdba74] bg-white px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, dealQuantity: event.target.value })} type="number" value={product.dealQuantity} /></label><label><span className="mb-1 block text-xs font-bold text-[#9a3412]">Đã bán deal</span><input className="h-11 w-full border border-[#fdba74] bg-white px-3 text-sm" min="0" onChange={(event) => setProduct({ ...product, dealSold: event.target.value })} type="number" value={product.dealSold} /></label><span /><label><span className="mb-1 block text-xs font-bold text-[#9a3412]">Bắt đầu</span><input className="h-11 w-full border border-[#fdba74] bg-white px-3 text-sm" onChange={(event) => setProduct({ ...product, dealStartAt: event.target.value })} type="datetime-local" value={product.dealStartAt} /></label><label><span className="mb-1 block text-xs font-bold text-[#9a3412]">Kết thúc</span><input className="h-11 w-full border border-[#fdba74] bg-white px-3 text-sm" onChange={(event) => setProduct({ ...product, dealEndAt: event.target.value })} type="datetime-local" value={product.dealEndAt} /></label></div> : null}
                </section>
              </div>

              <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e5e7eb] bg-white px-5 py-4">
                <Button className="rounded-lg" disabled={savingProduct} onClick={resetProductForm} type="button" variant="outline">Hủy</Button>
                <Button className="rounded-lg bg-[#465fff] hover:bg-[#3641f5]" disabled={savingProduct}>{savingProduct ? <LoaderCircle className="size-4 animate-spin" /> : null}Lưu thay đổi</Button>
              </footer>
            </form>
          </div>
        ) : null}

        {!editingId ? <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[minmax(280px,1fr)_150px_130px_130px_130px_100px] bg-[#f9fafb] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              <span>Sản phẩm</span><span>Danh mục</span><span>Giá bán</span><span>Trạng thái</span><span>Tồn kho</span><span />
            </div>
            <div className="divide-y divide-[#eef0f3]">
              {loading ? <p className="p-10 text-center text-sm text-[#8d94ac]">Đang tải sản phẩm...</p> : filteredProducts.map((item) => (
                <div className="grid grid-cols-[minmax(280px,1fr)_150px_130px_130px_130px_100px] items-center px-5 py-4 text-sm" key={item._id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <img className="size-12 shrink-0 border border-[#e5e7eb] object-contain" src={item.images?.[0] || "/icons.svg"} alt="" />
                    <div className="min-w-0"><p className="truncate font-bold text-[#344054]">{item.name}</p><p className="mt-0.5 truncate text-xs text-[#8d94ac]">{item.brand?.name || "Không thương hiệu"} · {item.productType.toUpperCase()}</p></div>
                  </div>
                  <span className="truncate font-semibold text-[#667085]">{item.category?.name || "—"}</span>
                  <strong className="text-[#1d2939]">{currency.format(item.price)}</strong>
                  <span className={`w-fit px-2.5 py-1 text-xs font-bold ${item.status === "active" ? "bg-[#ecfdf3] text-[#15803d]" : item.status === "inactive" ? "bg-[#f2f4f7] text-[#667085]" : "bg-[#fef2f2] text-[#dc2626]"}`}>{item.status === "active" ? "Đang bán" : item.status === "inactive" ? "Ngừng bán" : "Hết hàng"}</span>
                  <strong className={`text-base ${item.stock <= 5 ? "text-[#dc2626]" : "text-[#344054]"}`}>{item.stock}</strong>
                  <div className="flex justify-end gap-1">
                    <button className="grid size-9 place-items-center text-[#3278f6] hover:bg-[#eef4ff]" onClick={() => editProduct(item)} title="Sửa sản phẩm" type="button"><Pencil className="size-4" /></button>
                    <button className="grid size-9 place-items-center text-[#98a2b3] hover:bg-[#fef2f2] hover:text-[#dc2626]" onClick={() => void deleteProduct(item)} title="Xóa sản phẩm" type="button"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <form className="border border-[#e5e7eb] bg-white p-5" onSubmit={createCategory}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#eef4ff] text-[#465fff]"><Grid2X2 className="size-5" strokeWidth={1.8} /></span><div><h3 className="font-bold text-[#1d2939]">Thêm danh mục</h3><p className="text-sm text-[#8d94ac]">Nhóm sản phẩm theo loại.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="Tên danh mục" required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <input className="h-11 border border-[#d0d5dd] px-3 text-sm" placeholder="URL ảnh (tùy chọn)" value={categoryImage} onChange={(event) => setCategoryImage(event.target.value)} />
            <Button className="h-11 rounded-none bg-[#3278f6] hover:bg-[#2860c5]">Thêm</Button>
          </div>
        </form>
        <form className="border border-[#e5e7eb] bg-white p-5" onSubmit={createBrand}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#eef4ff] text-[#465fff]"><Tags className="size-5" strokeWidth={1.8} /></span><div><h3 className="font-bold text-[#1d2939]">Thêm thương hiệu</h3><p className="text-sm text-[#8d94ac]">Bổ sung hãng sản xuất.</p></div></div>
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
