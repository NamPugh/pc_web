import Brand from "../models/Brand.js";
import slugify from 'slugify';

export const createBrand = async (req, res) => {
  try {
    const data = req.body;

    if (!data.slug && data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true, locale: "vi" });
    }

    const brand = await Brand.create(data);
    res.status(201).json({ success: true, message: "Tạo thương hiệu thành công", data: brand });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo thương hiệu", error: error.message });
  }
};

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy thương hiệu", error: error.message });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Không tìm thấy thương hiệu" });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết thương hiệu", error: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const data = req.body;

    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true, locale: "vi" });
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });

    if (!brand) return res.status(404).json({ success: false, message: "Không tìm thấy thương hiệu" });

    res.json({ success: true, message: "Cập nhật thương hiệu thành công", data: brand });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật thương hiệu", error: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Không tìm thấy thương hiệu" });
    res.json({ success: true, message: "Xóa thương hiệu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa thương hiệu", error: error.message });
  }
};


