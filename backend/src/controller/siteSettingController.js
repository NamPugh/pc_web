import SiteSetting from "../models/SiteSetting.js";

const defaultSetting = {
  phone: "086 830 2123",
  email: "cskh@tncstore.vn",
  footerTitle: "PC Web",
  footerDescription: "Cửa hàng linh kiện PC với danh mục nhanh, deal nổi bật, build cấu hình và khu vực sản phẩm rõ ràng.",
  showroomAddress: "114 Chiến Thắng, Hà Nội",
  warrantyAddress: "114 Chiến Thắng, Hà Nội",
  newsletterTitle: "Đăng ký email để nhận tin khuyến mãi",
  newsletterDescription: "Nhận deal PC gaming, VGA, laptop và gaming gear mới nhất.",
  copyright: "© 2026 PC Web"
};

const getOrCreateSetting = () =>
  SiteSetting.findOneAndUpdate(
    {},
    { $setOnInsert: defaultSetting },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

export const getSiteSetting = async (_req, res) => {
  try {
    const setting = await getOrCreateSetting();
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể tải thông tin website", error: error.message });
  }
};

export const updateSiteSetting = async (req, res) => {
  try {
    const allowedFields = Object.keys(defaultSetting);
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, String(req.body[field]).trim()])
    );

    if (!updates.phone) return res.status(400).json({ success: false, message: "Số điện thoại không được để trống" });
    if (!updates.email) return res.status(400).json({ success: false, message: "Email không được để trống" });

    let setting = await SiteSetting.findOne();
    if (!setting) setting = new SiteSetting(defaultSetting);
    Object.assign(setting, updates);
    await setting.save();

    res.json({ success: true, message: "Cập nhật thông tin website thành công", data: setting });
  } catch (error) {
    res.status(400).json({ success: false, message: "Không thể cập nhật thông tin website", error: error.message });
  }
};
