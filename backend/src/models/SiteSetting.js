import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      default: "086 830 2123"
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "cskh@tncstore.vn"
    },
    footerTitle: {
      type: String,
      trim: true,
      default: "PC Web"
    },
    footerDescription: {
      type: String,
      trim: true,
      default: "Cửa hàng linh kiện PC với danh mục nhanh, deal nổi bật, build cấu hình và khu vực sản phẩm rõ ràng."
    },
    showroomAddress: {
      type: String,
      trim: true,
      default: "114 Chiến Thắng, Hà Nội"
    },
    warrantyAddress: {
      type: String,
      trim: true,
      default: "114 Chiến Thắng, Hà Nội"
    },
    newsletterTitle: {
      type: String,
      trim: true,
      default: "Đăng ký email để nhận tin khuyến mãi"
    },
    newsletterDescription: {
      type: String,
      trim: true,
      default: "Nhận deal PC gaming, VGA, laptop và gaming gear mới nhất."
    },
    copyright: {
      type: String,
      trim: true,
      default: "© 2026 PC Web"
    }
  },
  { timestamps: true }
);

const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);
export default SiteSetting;
