import Banner from "../models/Banner.js";

export const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, message: "Tạo banner thành công", data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo banner", error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const filter = {};
    if (req.query.position) filter.position = req.query.position;
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";

    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy banner", error: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!banner) return res.status(404).json({ success: false, message: "Không tìm thấy banner" });

    res.json({ success: true, message: "Cập nhật banner thành công", data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật banner", error: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) return res.status(404).json({ success: false, message: "Không tìm thấy banner" });

    res.json({ success: true, message: "Xóa banner thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa banner", error: error.message });
  }
};

export const uploadBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh banner" });
  }

  res.status(201).json({
    success: true,
    message: "Tải ảnh banner thành công",
    data: {
      image: `/uploads/banners/${req.file.filename}`
    }
  });
};

