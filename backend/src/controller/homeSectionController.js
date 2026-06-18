import HomeSection from "../models/HomeSection.js";

const normalizeProducts = (products) =>
  [...new Set(Array.isArray(products) ? products.filter(Boolean) : [])].slice(0, 4);

const populateSection = (query) =>
  query
    .populate("category", "name slug image")
    .populate({
      path: "products",
      populate: [
        { path: "category", select: "name slug" },
        { path: "brand", select: "name slug logo" }
      ]
    });

export const getHomeSections = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const sections = await populateSection(
      HomeSection.find(filter).sort({ sortOrder: 1, createdAt: 1 })
    );
    res.json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh mục trang chủ", error: error.message });
  }
};

export const createHomeSection = async (req, res) => {
  try {
    const data = { ...req.body, products: normalizeProducts(req.body.products) };
    const created = await HomeSection.create(data);
    const section = await populateSection(HomeSection.findById(created._id));
    res.status(201).json({ success: true, message: "Tạo danh mục trang chủ thành công", data: section });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo danh mục trang chủ", error: error.message });
  }
};

export const updateHomeSection = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.products !== undefined) data.products = normalizeProducts(data.products);
    const section = await populateSection(
      HomeSection.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    );

    if (!section) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục trang chủ" });
    res.json({ success: true, message: "Cập nhật danh mục trang chủ thành công", data: section });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật danh mục trang chủ", error: error.message });
  }
};

export const deleteHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục trang chủ" });
    res.json({ success: true, message: "Xóa danh mục trang chủ thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa danh mục trang chủ", error: error.message });
  }
};
