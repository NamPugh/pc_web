import { Building2, LoaderCircle, Mail, MapPin, Megaphone, Phone, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { adminApi, getErrorMessage, siteSettingApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { SiteSetting } from "@/types";

const defaultSetting: SiteSetting = {
  phone: "086 830 2123",
  email: "cskh@tncstore.vn",
  footerTitle: "PC Web",
  footerDescription: "Cửa hàng linh kiện PC với danh mục nhanh, deal nổi bật, build cấu hình và khu vực sản phẩm rõ ràng.",
  showroomAddress: "114 Chiến Thắng, Hà Nội",
  warrantyAddress: "114 Chiến Thắng, Hà Nội",
  newsletterTitle: "Đăng ký email để nhận tin khuyến mãi",
  newsletterDescription: "Nhận deal PC gaming, VGA, laptop và gaming gear mới nhất.",
  copyright: "© 2026 PC Web",
};

const inputClassName = "mt-2 h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10";
const labelClassName = "block text-sm font-bold text-[#344054]";

export default function SiteSettingManager() {
  const [form, setForm] = useState<SiteSetting>(defaultSetting);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void siteSettingApi.get()
      .then(({ data }) => {
        if (active) setForm(data.data);
      })
      .catch((error: unknown) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field: keyof SiteSetting, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await adminApi.updateSiteSetting(form);
      setForm(data.data);
      toast.success(data.message || "Đã cập nhật thông tin website");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border border-[#eaecf0] bg-white">
        <div className="text-center text-[#667085]">
          <LoaderCircle className="mx-auto size-7 animate-spin text-[#465fff]" />
          <p className="mt-3 text-sm font-semibold">Đang tải thông tin website...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#eaecf0] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Phone className="size-[22px] text-[#465fff]" />
          <h2 className="font-bold text-[#101828]">Thanh thông tin phía trên</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Số điện thoại
            <span className="relative block">
              <Phone className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-[#98a2b3]" />
              <input className={`${inputClassName} pl-10`} onChange={(event) => updateField("phone", event.target.value)} value={form.phone} />
            </span>
          </label>
          <label className={labelClassName}>
            Email chăm sóc khách hàng
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-[#98a2b3]" />
              <input className={`${inputClassName} pl-10`} onChange={(event) => updateField("email", event.target.value)} type="email" value={form.email} />
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#eaecf0] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building2 className="size-[22px] text-[#465fff]" />
          <h2 className="font-bold text-[#101828]">Thông tin footer</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Tên website
            <input className={inputClassName} onChange={(event) => updateField("footerTitle", event.target.value)} value={form.footerTitle} />
          </label>
          <label className={labelClassName}>
            Nội dung bản quyền
            <input className={inputClassName} onChange={(event) => updateField("copyright", event.target.value)} value={form.copyright} />
          </label>
          <label className={`${labelClassName} md:col-span-2`}>
            Giới thiệu ngắn
            <textarea className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#d0d5dd] bg-white px-3 py-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10" onChange={(event) => updateField("footerDescription", event.target.value)} value={form.footerDescription} />
          </label>
          <label className={labelClassName}>
            Địa chỉ showroom
            <span className="relative block">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-[#98a2b3]" />
              <input className={`${inputClassName} pl-10`} onChange={(event) => updateField("showroomAddress", event.target.value)} value={form.showroomAddress} />
            </span>
          </label>
          <label className={labelClassName}>
            Địa chỉ trung tâm bảo hành
            <span className="relative block">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-[#98a2b3]" />
              <input className={`${inputClassName} pl-10`} onChange={(event) => updateField("warrantyAddress", event.target.value)} value={form.warrantyAddress} />
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#eaecf0] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Megaphone className="size-[22px] text-[#465fff]" />
          <h2 className="font-bold text-[#101828]">Khu vực nhận khuyến mãi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Tiêu đề
            <input className={inputClassName} onChange={(event) => updateField("newsletterTitle", event.target.value)} value={form.newsletterTitle} />
          </label>
          <label className={labelClassName}>
            Mô tả
            <input className={inputClassName} onChange={(event) => updateField("newsletterDescription", event.target.value)} value={form.newsletterDescription} />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <Button className="h-11 rounded-lg bg-[#465fff] px-5 font-bold hover:bg-[#3641f5]" disabled={saving} onClick={() => void handleSave()} type="button">
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
