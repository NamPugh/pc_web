import { Eye, EyeOff, ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { adminApi, catalogApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Category, HomeSection, Product } from "@/types";

type SectionForm = {
  title: string;
  keyword: string;
  bannerImage: string;
  category: string;
  products: string[];
  isActive: boolean;
  sortOrder: string;
};

const emptyForm: SectionForm = {
  title: "",
  keyword: "",
  bannerImage: "",
  category: "",
  products: [],
  isActive: true,
  sortOrder: "0",
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const currentSectionDefaults = [
  { category: "PC Gaming", title: "PC Gaming nổi bật", keyword: "PC Gaming", bannerImage: "/tnc/category-banners/cat_big_82_1764436058.jpg" },
  { category: "PC Do Hoa AI", title: "PC Đồ Họa AI nổi bật", keyword: "PC đồ họa AI", bannerImage: "/tnc/category-banners/cat_big_210_1764436013.jpg" },
  { category: "Laptop Gaming", title: "Laptop - Máy Tính Xách Tay nổi bật", keyword: "Laptop", bannerImage: "/tnc/category-banners/cat_big_79_1764436023.jpg" },
  { category: "Man Hinh Gaming", title: "Màn Hình Máy Tính nổi bật", keyword: "Màn hình", bannerImage: "/tnc/category-banners/cat_big_68_1764436032.jpg" },
  { category: "VGA RTX 5070", title: "VGA - Card màn hình nổi bật", keyword: "RTX", bannerImage: "/tnc/categories/vga.png" },
  { category: "May PS5", title: "PlayStation 5 nổi bật", keyword: "PlayStation 5", bannerImage: "/tnc/category-banners/cat_big_217_1764436040.jpg" },
  { category: "Ghe Gaming", title: "Gaming Gears nổi bật", keyword: "Gaming Gear", bannerImage: "/tnc/category-banners/cat_big_78_1764436048.jpg" },
];

export default function HomeSectionManager() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<SectionForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectionResponse, categoryResponse, productResponse] = await Promise.all([
        catalogApi.homeSections(),
        catalogApi.categories(),
        catalogApi.products({ limit: 500, sort: "created_desc" }),
      ]);
      setSections(sectionResponse.data.data);
      setCategories(categoryResponse.data.data);
      setProducts(productResponse.data.data);
      setForm((current) => ({
        ...current,
        category: current.category || categoryResponse.data.data[0]?._id || "",
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
      catalogApi.homeSections(),
      catalogApi.categories(),
      catalogApi.products({ limit: 500, sort: "created_desc" }),
    ]).then(([sectionResponse, categoryResponse, productResponse]) => {
      if (!active) return;
      setSections(sectionResponse.data.data);
      setCategories(categoryResponse.data.data);
      setProducts(productResponse.data.data);
      setForm((current) => ({
        ...current,
        category: current.category || categoryResponse.data.data[0]?._id || "",
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

  const categoryProducts = useMemo(() => {
    const keyword = normalize(search);
    return products.filter((product) => {
      if (product.category?._id !== form.category) return false;
      return !keyword || normalize(product.name).includes(keyword);
    });
  }, [form.category, products, search]);

  const resetForm = () => {
    setEditingId("");
    setSearch("");
    setForm({ ...emptyForm, category: categories[0]?._id || "" });
  };

  const editSection = (section: HomeSection) => {
    setEditingId(section._id);
    setForm({
      title: section.title,
      keyword: section.keyword || "",
      bannerImage: section.bannerImage,
      category: section.category._id,
      products: section.products.map((product) => product._id),
      isActive: section.isActive,
      sortOrder: String(section.sortOrder),
    });
    setSearch("");
    document.querySelector("#home-section-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleProduct = (productId: string) => {
    setForm((current) => {
      if (current.products.includes(productId)) {
        return { ...current, products: current.products.filter((id) => id !== productId) };
      }
      if (current.products.length >= 4) {
        toast.warning("Mỗi khu vực chỉ hiển thị tối đa 4 sản phẩm");
        return current;
      }
      return { ...current, products: [...current.products, productId] };
    });
  };

  const uploadBanner = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await adminApi.uploadBanner(file);
      setForm((current) => ({ ...current, bannerImage: data.data.image }));
      toast.success("Đã tải banner lên");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.products.length) {
      toast.error("Hãy chọn ít nhất một sản phẩm");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      keyword: form.keyword.trim(),
      bannerImage: form.bannerImage.trim(),
      category: form.category,
      products: form.products,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        await adminApi.updateHomeSection(editingId, payload);
        toast.success("Đã cập nhật danh mục trang chủ");
      } else {
        await adminApi.createHomeSection(payload);
        toast.success("Đã thêm danh mục trang chủ");
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (section: HomeSection) => {
    try {
      await adminApi.updateHomeSection(section._id, { isActive: !section.isActive });
      await loadData();
      toast.success(section.isActive ? "Đã ẩn khu vực" : "Đã hiện khu vực");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeSection = async (section: HomeSection) => {
    if (!window.confirm(`Xóa khu vực "${section.title}"?`)) return;
    try {
      await adminApi.deleteHomeSection(section._id);
      if (editingId === section._id) resetForm();
      await loadData();
      toast.success("Đã xóa khu vực");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const importCurrentSections = async () => {
    const existingCategoryIds = new Set(sections.map((section) => section.category._id));
    const additions = currentSectionDefaults.flatMap((item, index) => {
      const category = categories.find((entry) => normalize(entry.name) === normalize(item.category));
      if (!category || existingCategoryIds.has(category._id)) return [];
      const selectedProducts = products
        .filter((product) => product.category?._id === category._id)
        .slice(0, 4)
        .map((product) => product._id);
      if (!selectedProducts.length) return [];
      return [{ ...item, category: category._id, products: selectedProducts, isActive: true, sortOrder: index }];
    });

    if (!additions.length) {
      toast.info("Các danh mục hiện tại đã được cấu hình");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(additions.map((payload) => adminApi.createHomeSection(payload)));
      await loadData();
      toast.success(`Đã nạp ${additions.length} khu vực trang chủ`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="border border-[#e5e7eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3278f6]">Giao diện trang chủ</p>
            <h2 className="mt-1 text-2xl font-black text-[#1d2939]">Danh mục sản phẩm hiển thị</h2>
            <p className="mt-1 text-sm text-[#8d94ac]">Quản lý banner, sản phẩm, thứ tự và trạng thái của từng khu vực.</p>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-none" disabled={saving} onClick={() => void importCurrentSections()} type="button" variant="outline">
              <ImagePlus className="size-4" /> Nạp cấu hình hiện tại
            </Button>
            <Button className="rounded-none bg-[#3278f6] hover:bg-[#2860c5]" onClick={resetForm} type="button">
              <Plus className="size-4" /> Khu vực mới
            </Button>
          </div>
        </header>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-3">
            {loading ? <p className="p-8 text-center text-sm text-[#8d94ac]">Đang tải cấu hình...</p> : null}
            {!loading && !sections.length ? <p className="border border-dashed border-[#d0d5dd] p-8 text-center text-sm text-[#8d94ac]">Chưa có cấu hình. Có thể dùng nút “Nạp cấu hình hiện tại”.</p> : null}
            {sections.map((section) => (
              <article className={`grid gap-4 border p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] ${section.isActive ? "border-[#d0d5dd]" : "border-[#e5e7eb] opacity-60"}`} key={section._id}>
                <img className="aspect-[260/405] h-36 w-full bg-[#f2f4f7] object-cover" src={section.bannerImage} alt={section.title} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-[#344054]">{section.title}</h3>
                    <span className="bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold text-[#3278f6]">Thứ tự {section.sortOrder}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#667085]">{section.category.name} · {section.products.length} sản phẩm</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {section.products.map((product) => (
                      <div className="w-20 shrink-0" key={product._id} title={product.name}>
                        <img className="size-16 border border-[#e5e7eb] object-contain" src={product.images?.[0] || "/icons.svg"} alt={product.name} />
                        <p className="mt-1 truncate text-[10px] text-[#667085]">{product.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <button className="grid size-9 place-items-center text-[#3278f6] hover:bg-[#eef4ff]" onClick={() => editSection(section)} title="Chỉnh sửa" type="button"><Pencil className="size-4" /></button>
                  <button className="grid size-9 place-items-center text-[#475467] hover:bg-[#f2f4f7]" onClick={() => void toggleSection(section)} title={section.isActive ? "Ẩn" : "Hiện"} type="button">{section.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                  <button className="grid size-9 place-items-center text-[#dc2626] hover:bg-[#fef2f2]" onClick={() => void removeSection(section)} title="Xóa" type="button"><Trash2 className="size-4" /></button>
                </div>
              </article>
            ))}
          </div>

          <form className="border border-[#d0d5dd] bg-[#f9fafb] p-4 xl:sticky xl:top-28" id="home-section-form" onSubmit={submit}>
            <h3 className="font-black text-[#344054]">{editingId ? "Chỉnh sửa khu vực" : "Thêm khu vực"}</h3>
            <div className="mt-4 space-y-3">
              <input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tiêu đề hiển thị" required value={form.title} />
              <input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setForm({ ...form, keyword: event.target.value })} placeholder="Từ khóa khi bấm Xem tất cả" value={form.keyword} />
              <select
                className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm"
                onChange={(event) => setForm({ ...form, category: event.target.value, products: [] })}
                required
                value={form.category}
              >
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>

              <input accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void uploadBanner(event.target.files?.[0])} ref={fileInputRef} type="file" />
              <button className="flex min-h-20 w-full flex-col items-center justify-center border border-dashed border-[#9cbcff] bg-[#f4f8ff] text-[#3278f6]" disabled={uploading} onClick={() => fileInputRef.current?.click()} type="button">
                {uploading ? <LoaderCircle className="size-5 animate-spin" /> : <Upload className="size-5" />}
                <span className="mt-1 text-xs font-bold">{uploading ? "Đang tải..." : "Tải banner từ máy"}</span>
              </button>
              <input className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm" onChange={(event) => setForm({ ...form, bannerImage: event.target.value })} placeholder="Đường dẫn banner" required value={form.bannerImage} />
              {form.bannerImage ? <img className="mx-auto h-52 max-w-full border border-[#d0d5dd] object-contain" src={form.bannerImage} alt="Xem trước banner" /> : null}

              <div className="border border-[#d0d5dd] bg-white">
                <div className="border-b border-[#e5e7eb] p-3">
                  <p className="text-sm font-bold text-[#344054]">Chọn sản phẩm ({form.products.length}/4)</p>
                  <label className="relative mt-2 block">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
                    <input className="h-10 w-full border border-[#d0d5dd] pl-9 pr-3 text-sm" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm..." value={search} />
                  </label>
                </div>
                <div className="max-h-64 divide-y divide-[#eef0f3] overflow-y-auto">
                  {categoryProducts.map((product) => (
                    <label className="flex cursor-pointer items-center gap-3 p-2 hover:bg-[#f8faff]" key={product._id}>
                      <input checked={form.products.includes(product._id)} className="size-4 accent-[#3278f6]" onChange={() => toggleProduct(product._id)} type="checkbox" />
                      <img className="size-11 object-contain" src={product.images?.[0] || "/icons.svg"} alt="" />
                      <span className="line-clamp-2 text-xs font-semibold text-[#475467]">{product.name}</span>
                    </label>
                  ))}
                  {!categoryProducts.length ? <p className="p-5 text-center text-xs text-[#98a2b3]">Danh mục chưa có sản phẩm phù hợp.</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <input className="h-11 border border-[#d0d5dd] bg-white px-3 text-sm" min="0" onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} placeholder="Thứ tự" type="number" value={form.sortOrder} />
                <label className="flex items-center gap-2 border border-[#d0d5dd] bg-white px-3 text-sm font-bold text-[#475467]">
                  <input checked={form.isActive} className="size-4 accent-[#3278f6]" onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" />
                  Hiển thị trên homepage
                </label>
              </div>
              <div className="flex gap-2">
                {editingId ? <Button className="flex-1 rounded-none" onClick={resetForm} type="button" variant="outline">Hủy sửa</Button> : null}
                <Button className="flex-1 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" disabled={saving || uploading}>
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm khu vực"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
