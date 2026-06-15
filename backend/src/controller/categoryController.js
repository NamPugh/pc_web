import Category from "../models/Category.js";
import slugify from 'slugify';

export const createCategory = async (req, res) => {
  try {
    const data = req.body;

    if (!data.slug && data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true, locale: "vi" });
    }

    const category = await Category.create(data);

    res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: category
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo danh mục", error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent", "name slug").sort({ createdAt: -1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh mục", error: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("parent", "name slug");

    if (!category) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết danh mục", error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const data = req.body;

    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true, locale: "vi" });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }

    res.json({ success: true, message: "Cập nhật danh mục thành công", data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật danh mục", error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }

    res.json({ success: true, message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa danh mục", error: error.message });
  }
};


