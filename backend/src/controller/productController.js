import Product from '../models/Product.js';
import slugify from 'slugify';

export const createProduct = async (req, res) => {
    try {
        const data = req.body;
        if(!data.slug && data.name) {
            data.slug = slugify(data.name, {
                lower: true,
                strict: true, 
                locale: "vi"
            });
        }

        const product = await Product.create(data);

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
        status
    } = query;

    const filter = {};
    // tìm kiếm bằng keyword 
    if(keyword) filter.name = {$regex: keyword, $options: "i"};
    // các trường có thông tin rõ ràng
    if(category) filter.category = category;
    if(brand) filter.brand = brand;
    if(productType) filter.productType = productType;
    // trả chuỗi trên param
    if(isFeatured) filter.isFeatured = isFeatured === "true";
    if(isDeal) filter.isDeal = isDeal === "true";
    if(activeDeal === "true") {
        const now = new Date();
        filter.isDeal = true;
        filter.dealPrice = {$gt: 0};
        filter.dealStartAt = {$lte: now};
        filter.dealEndAt = {$gt: now};
        filter.$expr = {$lt: ["$dealSold", "$dealQuantity"]};
    }
    if(status) filter.status = status;
    if(minPrice || maxPrice) {
        filter.price = {};
        if(minPrice) filter.price.$gte = Number(minPrice); // gte greater than or equal: lớn hơn hoặc băng
        if(maxPrice) filter.price.$lte = Number(maxPrice); // lte less than or equal: nhỏ hơn hoặc bằng
    }

    return filter;
};

export const getSortOption = (sort) => {
    switch (sort) {
        case "price_asc":
            return {price: 1};
        case "price_desc":
            return {price: -1};
        case "sold_desc":
            return {sold: -1};
        case "rating_desc": 
            return {ratingAverage: -1};
        default: 
            return {createdAt: -1};
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
        
        if(!product) {
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
        const product = await Product.findOne({slug: req.params.slug})
            .populate("category", "name slug")
            .populate("brand", "name slug logo");
        
        if(!product) {
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
        const data = req.body;
        if(data.isDeal) {
            const dealPrice = Number(data.dealPrice);
            const dealQuantity = Number(data.dealQuantity);
            const dealStartAt = new Date(data.dealStartAt);
            const dealEndAt = new Date(data.dealEndAt);
            const currentProduct = await Product.findById(req.params.id);

            if(!currentProduct) {
                return res.status(404).json({success: false, message: "Không tìm thấy sản phẩm"});
            }
            if(!dealPrice || dealPrice >= currentProduct.price) {
                return res.status(400).json({success: false, message: "Giá deal phải lớn hơn 0 và thấp hơn giá bán"});
            }
            if(!dealQuantity || dealQuantity < 1) {
                return res.status(400).json({success: false, message: "Số lượng deal phải lớn hơn 0"});
            }
            if(dealQuantity > currentProduct.stock) {
                return res.status(400).json({success: false, message: "Số lượng deal không được vượt quá tồn kho"});
            }
            if(Number.isNaN(dealStartAt.getTime()) || Number.isNaN(dealEndAt.getTime()) || dealEndAt <= dealStartAt) {
                return res.status(400).json({success: false, message: "Thời gian deal không hợp lệ"});
            }
        }
        if(data.name && !data.slug) {
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

        if(!product) {
            return res.status(404).json({
                success: true,
                message: "Không tìm thấy sản phẩm"
            });
        }

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

        if(!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
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

