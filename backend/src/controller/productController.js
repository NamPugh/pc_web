import Product from '../models/Product.js';
import slugify from 'slugify';
import Cart from '../models/Cart.js';
import FlashSale from '../models/FlashSale.js';
import HomeSection from '../models/HomeSection.js';

const normalizeImages = (images) => {
    if (!images) return [];
    const values = Array.isArray(images) ? images : String(images).split(/[|;\n]+/);
    return [...new Set(values.map((image) => String(image).trim()).filter(Boolean))];
};

export const createProduct = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.images !== undefined) data.images = normalizeImages(data.images);
        if (!data.slug && data.name) {
            data.slug = slugify(data.name, {
                lower: true,
                strict: true,
                locale: "vi"
            });
        }
        const price = Number(data.price);
        const oldPrice = Number(data.oldPrice);
        data.discount = oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;

        const product = await Product.create(data);
        await product.populate("category", "name slug");
        await product.populate("brand", "name slug logo");

        res.status(201).json({
            success: true,
            message: "Tạo sản phẩm thành công",
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Lỗi tạo sản phẩm",
            error: error.message
        });
    }
};

export const buildProductFilter = (query) => {
    const {
        keyword,
        category,
        brand,
        productType,
        minPrice,
        maxPrice,
        isFeatured,
        isDeal,
        activeDeal,
        status,
        priceRanges
    } = query;

    const filter = {};
    const parseList = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    // tìm kiếm theo các thông tin chính của sản phẩm
    if (keyword) {
        const safeKeyword = String(keyword).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (safeKeyword) {
            const searchPattern = { $regex: safeKeyword, $options: "i" };
            filter.$or = [
                { name: searchPattern },
                { sku: searchPattern }
                //{description: searchPattern}
            ];
        }
    }
    // các trường có thông tin rõ ràng
    if (category) {
        const values = parseList(category);
        filter.category = values.length > 1 ? { $in: values } : values[0];
    }
    if (brand) {
        const values = parseList(brand);
        filter.brand = values.length > 1 ? { $in: values } : values[0];
    }
    if (productType) {
        const values = parseList(productType);
        filter.productType = values.length > 1 ? { $in: values } : values[0];
    }
    // trả chuỗi trên param
    if (isFeatured) filter.isFeatured = isFeatured === "true";
    if (isDeal) filter.isDeal = isDeal === "true";
    if (activeDeal === "true") {
        const now = new Date();
        filter.isDeal = true;
        filter.dealPrice = { $gt: 0 };
        filter.dealStartAt = { $lte: now };
        filter.dealEndAt = { $gt: now };
        filter.$expr = { $lt: ["$dealSold", "$dealQuantity"] };
    }
    if (status) filter.status = status;
    const min = minPrice != null && minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice != null && maxPrice !== '' ? Number(maxPrice) : null;
    if (min != null || max != null) {
        filter.price = {};
        if (min != null) filter.price.$gte = min;
        if (max != null) filter.price.$lte = max;
    }
    if (priceRanges) {
        const ranges = {
            "under-10": { price: { $gte: 0, $lt: 10_000_000 } },
            "10-20": { price: { $gte: 10_000_000, $lt: 20_000_000 } },
            "20-30": { price: { $gte: 20_000_000, $lt: 30_000_000 } },
            "30-50": { price: { $gte: 30_000_000, $lt: 50_000_000 } },
            "50-80": { price: { $gte: 50_000_000, $lt: 80_000_000 } },
            "over-80": { price: { $gte: 80_000_000 } }
        };
        const selectedRanges = parseList(priceRanges).map((range) => ranges[range]).filter(Boolean);
        if (selectedRanges.length) filter.$and = [...(filter.$and || []), { $or: selectedRanges }];
    }

    return filter;
};

export const getSortOption = (sort) => {
    switch (sort) {
        case "price_asc":
            return { price: 1 };
        case "price_desc":
            return { price: -1 };
        case "sold_desc":
            return { sold: -1 };
        case "rating_desc":
            return { ratingAverage: -1 };
        case "created_desc":
            return { createdAt: -1 };
        case "created_asc":
            return { createdAt: 1 };
        default:
            return { createdAt: -1 };
    }
};

export const getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const filter = buildProductFilter(req.query);
        const sortOption = getSortOption(req.query.sort);
        const product = await Product.find(filter)
            .populate("category", "name slug")
            .populate("brand", "name slug logo")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            count: product.length,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            data: product
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách sản phẩm",
            error: error.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category", "name slug")
            .populate("brand", "name slug logo")

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        res.json({
            success: true,
            data: product
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy chi tiết sản phẩm",
            error: error.message
        });
    }
};

export const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate("category", "name slug")
            .populate("brand", "name slug logo");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            })
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy chi tiết sản phẩm",
            error: error.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const data = { ...req.body };
        const currentProduct = await Product.findById(req.params.id);
        if (!currentProduct) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        if (data.images !== undefined) data.images = normalizeImages(data.images);
        const nextPrice = data.price !== undefined ? Number(data.price) : currentProduct.price;
        const nextOldPrice = data.oldPrice !== undefined ? Number(data.oldPrice) : currentProduct.oldPrice;
        data.discount = nextOldPrice > nextPrice ? Math.round((1 - nextPrice / nextOldPrice) * 100) : 0;
        if (data.isDeal) {
            const dealPrice = Number(data.dealPrice);
            const dealQuantity = Number(data.dealQuantity);
            const dealStartAt = new Date(data.dealStartAt);
            const dealEndAt = new Date(data.dealEndAt);
            if (!dealPrice || dealPrice >= nextPrice) {
                return res.status(400).json({ success: false, message: "Giá deal phải lớn hơn 0 và thấp hơn giá bán" });
            }
            if (!dealQuantity || dealQuantity < 1) {
                return res.status(400).json({ success: false, message: "Số lượng deal phải lớn hơn 0" });
            }
            if (dealQuantity > currentProduct.stock) {
                return res.status(400).json({ success: false, message: "Số lượng deal không được vượt quá tồn kho" });
            }
            if (Number.isNaN(dealStartAt.getTime()) || Number.isNaN(dealEndAt.getTime()) || dealEndAt <= dealStartAt) {
                return res.status(400).json({ success: false, message: "Thời gian deal không hợp lệ" });
            }
        }
        if (data.name && !data.slug) {
            data.slug = slugify(
                data.name,
                {
                    lower: true,
                    strict: true,
                    locale: "vi"
                }
            );
        }

        const product = await Product.findByIdAndUpdate(req.params.id, data,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        await product.populate("category", "name slug");
        await product.populate("brand", "name slug logo");

        res.json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: product
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật sản phẩm",
            error: error.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        await Promise.all([
            Cart.updateMany(
                { "items.product": product._id },
                { $pull: { items: { product: product._id } } }
            ),
            FlashSale.updateMany(
                { "items.product": product._id },
                { $pull: { items: { product: product._id } } }
            ),
            HomeSection.updateMany(
                { products: product._id },
                { $pull: { products: product._id } }
            )
        ]);
        res.json({
            success: true,
            message: "Xóa sản phẩm thành công"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa sản phẩm",
            error: error.message
        });
    }
};

export const deleteAllProducts = async (_req, res) => {
    try {
        const result = await Product.deleteMany({});
        await Promise.all([
            Cart.updateMany({}, { $set: { items: [], totalPrice: 0 } }),
            FlashSale.updateMany({}, { $set: { items: [] } }),
            HomeSection.updateMany({}, { $set: { products: [] } })
        ]);

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} sản phẩm`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa toàn bộ sản phẩm",
            error: error.message
        });
    }
};

