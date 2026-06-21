import { AlertTriangle, Eye, EyeOff, ImagePlus, LoaderCircle, Pencil, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { adminApi, catalogApi, getErrorMessage } from "@/api/client";
import AdminSelect from "@/components/admin/AdminSelect";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types";

const positions = [
  { value: "home_main", label: "Banner chính trang chủ" },
  { value: "home_side", label: "Banner phụ trang chủ" },
  { value: "deal", label: "Banner khuyến mãi / Deal" },
  { value: "category", label: "Banner danh mục" },
];

type BannerForm = {
  title: string;
  image: string;
  link: string;
  position: string;
  isActive: boolean;
  sortOrder: string;
};

const initialForm: BannerForm = {
  title: "",
  image: "",
  link: "/",
  position: "home_main",
  isActive: true,
  sortOrder: "0",
};

const defaultBanners = [
  "banner-shopee-15-6-pc.jpg",
  "banner-trang-chu-asus-t1-pc-2.jpg",
  "banner-build-pc-gigabyte-intel-pc.jpg",
  "banner-trang-chu-msi-frieren.jpg",
  "banner-build-pc-asus-rinh-qua-het-nac.jpg",
  "banner-trang-chu-asus-hiku.jpg",
  "banner-razer-len-deal-gear-len-doi.png",
].map((file, index) => ({
  title: file.replace(/\.(jpg|png)$/i, "").replaceAll("-", " "),
  image: `/tnc/hero/${file}`,
  link: "/",
  position: "home_main",
  isActive: true,
  sortOrder: index,
}));

const defaultPromotions = Array.from({ length: 8 }, (_, index) => ({
  title: `Khuyến mãi ${index + 1}`,
  image: `/tnc/promos/promo-${index + 1}.jpg`,
  link: "/?keyword=Khuyến mãi",
  position: "deal",
  isActive: true,
  sortOrder: index,
}));

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerForm>(initialForm);
  const [editingId, setEditingId] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data } = await catalogApi.banners();
      setBanners(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void catalogApi.banners()
      .then(({ data }) => {
        if (!active) return;
        setBanners(data.data);
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
  }, []);

  const visibleBanners = useMemo(
    () => (filter === "all" ? banners : banners.filter((banner) => banner.position === filter)),
    [banners, filter],
  );

  const resetForm = () => {
    setEditingId("");
    setForm(initialForm);
  };

  const editBanner = (banner: Banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title,
      image: banner.image,
      link: banner.link || "/",
      position: banner.position || "home_main",
      isActive: banner.isActive !== false,
      sortOrder: String(banner.sortOrder ?? 0),
    });
    document.querySelector("#banner-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      image: form.image.trim(),
      link: form.link.trim() || "/",
      position: form.position,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (editingId) {
        const { data } = await adminApi.updateBanner(editingId, payload);
        setBanners((current) =>
          current.map((banner) => (banner._id === editingId ? data.data : banner)),
        );
        toast.success("Đã cập nhật banner");
      } else {
        const { data } = await adminApi.createBanner(payload);
        setBanners((current) => [...current, data.data].sort(
          (first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
        ));
        toast.success("Đã thêm banner");
      }
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleBanner = async (banner: Banner) => {
    const nextActive = banner.isActive === false;
    setTogglingIds((current) => new Set(current).add(banner._id));
    setBanners((current) =>
      current.map((item) => (item._id === banner._id ? { ...item, isActive: nextActive } : item)),
    );
    try {
      const { data } = await adminApi.updateBanner(banner._id, { isActive: nextActive });
      setBanners((current) =>
        current.map((item) => (item._id === banner._id ? data.data : item)),
      );
      toast.success(nextActive ? "Đã bật banner" : "Đã ẩn banner");
    } catch (error) {
      setBanners((current) =>
        current.map((item) => (item._id === banner._id ? banner : item)),
      );
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingIds((current) => {
        const next = new Set(current);
        next.delete(banner._id);
        return next;
      });
    }
  };

  const deleteBanner = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteBanner(deleteTarget._id);
      if (editingId === deleteTarget._id) resetForm();
      setBanners((current) => current.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Đã xóa banner");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await adminApi.uploadBanner(file);
      setForm((current) => ({
        ...current,
        image: data.data.image,
        title: current.title || file.name.replace(/\.[^.]+$/, "").replaceAll("-", " "),
      }));
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const importDefaultBanners = async () => {
    const existingImages = new Set(banners.map((banner) => banner.image));
    const missingBanners = [...defaultBanners, ...defaultPromotions].filter(
      (banner) => !existingImages.has(banner.image),
    );

    if (missingBanners.length === 0) {
      toast.info("Bộ banner mặc định đã có trong hệ thống");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(missingBanners.map((banner) => adminApi.createBanner(banner)));
      await loadBanners();
      toast.success(`Đã nạp ${missingBanners.length} banner mặc định`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#ededed] bg-white" id="banner-management">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededed] px-5 py-4">
        <div>
          <h2 className="text-2xl font-bold text-[#29324e]">Banner website</h2>
        </div>
        <div className="flex items-center gap-2">
          <AdminSelect
            className="h-10 min-w-52"
            options={[
              { value: "all", label: "Tất cả vị trí" },
              ...positions,
            ]}
            value={filter}
            onValueChange={setFilter}
          />
          <Button className="rounded-lg border border-[#3278f6] bg-white text-[#3278f6] hover:bg-[#eef4ff]" disabled={saving} onClick={() => void importDefaultBanners()} type="button">
            <ImagePlus className="size-4" />
            Nạp banner mặc định
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="overflow-x-auto rounded-xl border border-[#ededed]">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[150px_minmax(210px,1fr)_150px_70px_110px] bg-[#f5f5f5] px-3 py-3 text-xs font-bold uppercase text-[#8d94ac]">
              <span>Ảnh</span>
              <span>Thông tin</span>
              <span>Vị trí</span>
              <span>Thứ tự</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-[#ededed]">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#8d94ac]">Đang tải banner...</div>
              ) : visibleBanners.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#8d94ac]">Chưa có banner ở vị trí này.</div>
              ) : (
                visibleBanners.map((banner) => (
                  <div className="grid grid-cols-[150px_minmax(210px,1fr)_150px_70px_110px] items-center gap-3 px-3 py-3" key={banner._id}>
                    <div className="aspect-[16/6] overflow-hidden rounded-lg border border-[#ededed] bg-[#f5f5f5]">
                      <img className="h-full w-full object-cover" src={banner.image} alt={banner.title} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <b className="truncate text-sm text-[#29324e]">{banner.title}</b>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase ${banner.isActive === false ? "bg-[#ededed] text-[#8d94ac]" : "bg-[#eaf8ee] text-[#13ad05]"}`}>
                          {banner.isActive === false ? "Đang ẩn" : "Đang hiện"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[#8d94ac]">{banner.link || "/"}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#29324e]">
                      {positions.find((position) => position.value === banner.position)?.label || banner.position}
                    </span>
                    <span className="text-sm font-bold text-[#29324e]">{banner.sortOrder ?? 0}</span>
                    <div className="flex justify-end gap-1">
                      <button className="grid size-9 place-items-center rounded-lg text-[#3278f6] transition hover:bg-[#eef4ff]" onClick={() => editBanner(banner)} title="Sửa banner" type="button">
                        <Pencil className="size-4" />
                      </button>
                      <button className="grid size-9 place-items-center rounded-lg text-[#29324e] transition hover:bg-[#f5f5f5]" onClick={() => void toggleBanner(banner)} title={banner.isActive === false ? "Hiện banner" : "Ẩn banner"} type="button">
                        {togglingIds.has(banner._id) ? <LoaderCircle className="size-4 animate-spin" /> : banner.isActive === false ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                      <button className="grid size-9 place-items-center rounded-lg text-[#fb4e4e] transition hover:bg-[#fff1f1]" onClick={() => setDeleteTarget(banner)} title="Xóa banner" type="button">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <form className="rounded-xl border border-[#ededed] bg-[#f9fafc] p-5 xl:sticky xl:top-48" id="banner-form" onSubmit={submitBanner}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center bg-[#eef4ff] text-[#3278f6]">
                <ImagePlus className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#29324e]">{editingId ? "Sửa banner" : "Thêm banner"}</h3>
                <p className="text-xs text-[#8d94ac]">Tải ảnh từ máy hoặc nhập đường dẫn có sẵn.</p>
              </div>
            </div>
            {editingId ? (
              <button className="grid size-9 place-items-center text-[#8d94ac] hover:bg-white" onClick={resetForm} title="Hủy chỉnh sửa" type="button">
                <RotateCcw className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#29324e]">Tên banner</span>
              <input className="h-11 w-full rounded-lg border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#3278f6]" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#29324e]">Ảnh banner</span>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void uploadImage(event.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="mb-2 flex min-h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#9cbcff] bg-[#f4f8ff] px-4 text-center transition hover:bg-[#eef4ff] disabled:cursor-wait"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {uploading ? <LoaderCircle className="size-6 animate-spin text-[#3278f6]" /> : <Upload className="size-6 text-[#3278f6]" />}
                <b className="mt-2 text-sm text-[#3278f6]">{uploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}</b>
                <span className="mt-1 text-xs text-[#8d94ac]">JPG, PNG, WEBP hoặc GIF · tối đa 8 MB</span>
              </button>
              <input className="h-11 w-full rounded-lg border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#3278f6]" placeholder="/tnc/hero/banner.jpg hoặc https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} required />
            </label>
            {form.image ? (
              <div className="aspect-[16/6] overflow-hidden rounded-xl border border-[#dedede] bg-white">
                <img className="h-full w-full object-cover" src={form.image} alt="Xem trước banner" />
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#29324e]">Liên kết khi bấm</span>
              <input className="h-11 w-full rounded-lg border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#3278f6]" placeholder="/?keyword=PC Gaming" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} />
            </label>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-[#29324e]">Vị trí</span>
                <AdminSelect className="w-full" options={positions} value={form.position} onValueChange={(position) => setForm({ ...form, position })} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-[#29324e]">Thứ tự</span>
                <input className="h-11 w-full rounded-lg border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#3278f6]" min="0" type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-[#dedede] bg-white px-3 py-3 text-sm font-bold text-[#29324e]">
              <input checked={form.isActive} className="size-4 accent-[#3278f6]" onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" />
              Hiển thị banner trên website
            </label>
            <Button className="h-11 w-full rounded-lg bg-[#3278f6] font-bold hover:bg-[#2860c5]" disabled={saving || uploading}>
              {saving ? "Đang lưu..." : editingId ? "Cập nhật banner" : "Thêm banner"}
            </Button>
          </div>
        </form>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[140] grid place-items-center bg-[#101828]/55 p-4" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(16,24,40,0.28)]" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-4">
              <h2 className="text-lg font-bold text-[#101828]">Xác nhận xóa banner</h2>
              <button className="grid size-9 place-items-center rounded-lg text-[#667085] transition hover:bg-[#f2f4f7]" disabled={deleting} onClick={() => setDeleteTarget(null)} type="button">
                <X className="size-5" />
              </button>
            </header>
            <div className="p-5">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fef3f2] text-[#d92d20]">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <p className="font-bold text-[#344054]">Bạn có chắc muốn xóa banner này?</p>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">
                    Banner <b className="text-[#344054]">“{deleteTarget.title}”</b> sẽ bị xóa khỏi hệ thống.
                  </p>
                </div>
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#eaecf0] bg-[#f9fafb] px-5 py-4">
              <Button className="rounded-lg" disabled={deleting} onClick={() => setDeleteTarget(null)} type="button" variant="outline">Hủy</Button>
              <Button className="rounded-lg bg-[#d92d20] text-white hover:bg-[#b42318]" disabled={deleting} onClick={() => void deleteBanner()} type="button">
                {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {deleting ? "Đang xóa..." : "Xóa banner"}
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
