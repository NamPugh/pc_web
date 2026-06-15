import News from "../models/News.js";
import slugify from 'slugify';

export const createNews = async (req, res) => {
  try {
    const data = req.body;

    if (!data.slug && data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true, locale: "vi" });
    }

    data.author = req.user._id;

    const news = await News.create(data);

    res.status(201).json({ success: true, message: "Tạo bài viết thành công", data: news });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo bài viết", error: error.message });
  }
};

export const getNewsList = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.keyword) filter.title = { $regex: req.query.keyword, $options: "i" };

    const newsList = await News.find(filter)
      .populate("author", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: newsList.length, data: newsList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy bài viết", error: error.message });
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate("author", "fullName email");

    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết bài viết", error: error.message });
  }
};

export const getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug }).populate("author", "fullName email");

    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết bài viết", error: error.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const data = req.body;

    if (data.title && !data.slug) {
      data.slug = slugify(data.title, { lower: true, strict: true, locale: "vi" });
    }

    const news = await News.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });

    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, message: "Cập nhật bài viết thành công", data: news });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật bài viết", error: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, message: "Xóa bài viết thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa bài viết", error: error.message });
  }
};
