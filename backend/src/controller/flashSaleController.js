import FlashSale from "../models/FlashSale.js";
import Product from "../models/Product.js";

const populateSale = (query) =>
  query.populate("items.product", "name slug price stock images brand category productType ratingAverage ratingCount");

const validatePeriod = (startAt, endAt) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
};

const findOverlappingActiveSale = (startAt, endAt, excludeId) =>
  FlashSale.findOne({
    _id: { $ne: excludeId },
    status: "active",
    startAt: { $lt: new Date(endAt) },
    endAt: { $gt: new Date(startAt) }
  });

export const getFlashSales = async (req, res) => {
  try {
    const sales = await populateSale(FlashSale.find().sort({ startAt: -1 }));
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách đợt deal", error: error.message });
  }
};

export const getActiveFlashSale = async (req, res) => {
  try {
    const now = new Date();
    const sale = await populateSale(
      FlashSale.findOne({
        status: "active",
        startAt: { $lte: now },
        endAt: { $gt: now }
      }).sort({ startAt: -1 })
    );

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy Deal giờ vàng", error: error.message });
  }
};

export const createFlashSale = async (req, res) => {
  try {
    const { name, startAt, endAt, status = "draft" } = req.body;
    if (!validatePeriod(startAt, endAt)) {
      return res.status(400).json({ success: false, message: "Thời gian bắt đầu và kết thúc không hợp lệ" });
    }
    if (status === "active" && await findOverlappingActiveSale(startAt, endAt, null)) {
      return res.status(400).json({ success: false, message: "Đã có một đợt đang kích hoạt trùng thời gian" });
    }

    const sale = await FlashSale.create({ name, startAt, endAt, status, items: [] });
    res.status(201).json({ success: true, message: "Đã tạo đợt Deal giờ vàng", data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo đợt deal", error: error.message });
  }
};

export const updateFlashSale = async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Không tìm thấy đợt deal" });

    const startAt = req.body.startAt ?? sale.startAt;
    const endAt = req.body.endAt ?? sale.endAt;
    if (!validatePeriod(startAt, endAt)) {
      return res.status(400).json({ success: false, message: "Thời gian bắt đầu và kết thúc không hợp lệ" });
    }
    const nextStatus = req.body.status ?? sale.status;
    if (nextStatus === "active" && await findOverlappingActiveSale(startAt, endAt, sale._id)) {
      return res.status(400).json({ success: false, message: "Đã có một đợt đang kích hoạt trùng thời gian" });
    }

    if (req.body.name !== undefined) sale.name = req.body.name;
    if (req.body.startAt !== undefined) sale.startAt = req.body.startAt;
    if (req.body.endAt !== undefined) sale.endAt = req.body.endAt;
    if (req.body.status !== undefined) sale.status = req.body.status;
    await sale.save();

    const populated = await populateSale(FlashSale.findById(sale._id));
    res.json({ success: true, message: "Đã cập nhật đợt deal", data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật đợt deal", error: error.message });
  }
};

export const deleteFlashSale = async (req, res) => {
  try {
    const sale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Không tìm thấy đợt deal" });
    res.json({ success: true, message: "Đã xóa đợt deal" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa đợt deal", error: error.message });
  }
};

export const addFlashSaleItem = async (req, res) => {
  try {
    const { productId, dealPrice, quantity } = req.body;
    const [sale, product] = await Promise.all([
      FlashSale.findById(req.params.id),
      Product.findById(productId)
    ]);
    if (!sale) return res.status(404).json({ success: false, message: "Không tìm thấy đợt deal" });
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    if (sale.items.some((item) => item.product.toString() === productId)) {
      return res.status(400).json({ success: false, message: "Sản phẩm đã có trong đợt deal này" });
    }
    if (Number(dealPrice) <= 0 || Number(dealPrice) >= product.price) {
      return res.status(400).json({ success: false, message: "Giá deal phải thấp hơn giá bán" });
    }
    if (Number(quantity) < 1 || Number(quantity) > product.stock) {
      return res.status(400).json({ success: false, message: "Số suất deal không hợp lệ hoặc vượt tồn kho" });
    }

    sale.items.push({ product: productId, dealPrice: Number(dealPrice), quantity: Number(quantity), sold: 0 });
    await sale.save();
    const populated = await populateSale(FlashSale.findById(sale._id));
    res.json({ success: true, message: "Đã thêm sản phẩm vào đợt deal", data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi thêm sản phẩm vào deal", error: error.message });
  }
};

export const updateFlashSaleItem = async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Không tìm thấy đợt deal" });
    const item = sale.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong deal" });
    const product = await Product.findById(item.product);
    const dealPrice = Number(req.body.dealPrice ?? item.dealPrice);
    const quantity = Number(req.body.quantity ?? item.quantity);

    if (!product || dealPrice <= 0 || dealPrice >= product.price) {
      return res.status(400).json({ success: false, message: "Giá deal không hợp lệ" });
    }
    if (quantity < item.sold || quantity > product.stock) {
      return res.status(400).json({ success: false, message: "Số suất phải lớn hơn số đã bán và không vượt tồn kho" });
    }

    item.dealPrice = dealPrice;
    item.quantity = quantity;
    await sale.save();
    const populated = await populateSale(FlashSale.findById(sale._id));
    res.json({ success: true, message: "Đã cập nhật sản phẩm deal", data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật sản phẩm deal", error: error.message });
  }
};

export const deleteFlashSaleItem = async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Không tìm thấy đợt deal" });
    const item = sale.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong deal" });
    item.deleteOne();
    await sale.save();
    const populated = await populateSale(FlashSale.findById(sale._id));
    res.json({ success: true, message: "Đã xóa sản phẩm khỏi deal", data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi xóa sản phẩm deal", error: error.message });
  }
};
