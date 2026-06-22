import Review from "../models/Review.js";
import Product from "../models/Product.js";

export const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });

  const ratingCount = reviews.length;
  const ratingAverage =
    ratingCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount;

  await Product.findByIdAndUpdate(productId, {
    ratingCount,
    ratingAverage: Number(ratingAverage.toFixed(1))
  });
};

export const createReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
      images
    });

    await updateProductRating(productId);
    await review.populate("user", "userName avatarUrl");

    res.status(201).json({ success: true, message: "Đánh giá thành công", data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo đánh giá. Mỗi tài khoản chỉ đánh giá một lần cho một sản phẩm.", error: error.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "userName avatarUrl")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy đánh giá", error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const review = await Review.findOneAndDelete(filter);

    if (!review) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    await updateProductRating(review.product);

    res.json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa đánh giá", error: error.message });
  }
};
