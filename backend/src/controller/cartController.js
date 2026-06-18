import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import FlashSale from '../models/FlashSale.js';

const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const getActiveDealItem = async (productId) => {
    const now = new Date();
    const sale = await FlashSale.findOne({
        status: "active",
        startAt: {$lte: now},
        endAt: {$gt: now},
        items: {$elemMatch: {product: productId}}
    });
    if(!sale) return null;
    const item = sale.items.find((entry) => entry.product.toString() === productId.toString());
    if(!item || item.sold >= item.quantity) return null;
    return {sale, item};
};

export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({user: req.user._id}).populate("items.product");
        // Không có cart thì tạo 1 cart mới 
        if(!cart) {
            cart = await Cart.create({user: req.user._id, items: [], totalPrice: 0});
        } else {
            for (const item of cart.items) {
                if(!item.product) continue;
                const activeDeal = await getActiveDealItem(item.product._id);
                item.price = activeDeal?.item.dealPrice || item.product.price;
                item.flashSale = activeDeal?.sale._id || null;
                item.flashSaleItem = activeDeal?.item._id || null;
            }
            cart.totalPrice = calculateTotal(cart.items);
            await cart.save();
        }
        res.json({success: true, data: cart});
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy giỏ hàng",
            error: error.message
        });
    }
};

export const addToCart = async (req, res) => {
    try {
        // mặc định số lượng bằng 1 nếu ko thay đổi giá trị
        const {productId, quantity = 1} = req.body;
        const product = await Product.findById(productId);
        if(!product) return res.status(404).json({
            success: false,
            message: "Không tìm thấy sản phẩm",
        });
        let cart = await Cart.findOne({user: req.user._id});
        if(!cart) {
            cart = await Cart.create({user: req.user._id, items: [], totalPrice: 0});
        }
        const activeDeal = await getActiveDealItem(product._id);
        const currentPrice = activeDeal?.item.dealPrice || product.price;
        // kiểm tra sản phẩm đang thêm có trong giỏ hàng
        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );
        const requestedQuantity = Number(quantity);
        const currentQuantity = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
        const nextQuantity = currentQuantity + requestedQuantity;

        if(!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
            return res.status(400).json({success: false, message: "Số lượng sản phẩm không hợp lệ"});
        }
        if(nextQuantity > product.stock) {
            return res.status(400).json({success: false, message: "Số lượng vượt quá tồn kho"});
        }
        if(activeDeal && nextQuantity > activeDeal.item.quantity - activeDeal.item.sold) {
            return res.status(400).json({success: false, message: "Số lượng vượt quá suất ưu đãi còn lại"});
        }

        if(itemIndex > -1) {
            cart.items[itemIndex].quantity = nextQuantity;
            cart.items[itemIndex].price = currentPrice;
            cart.items[itemIndex].flashSale = activeDeal?.sale._id || null;
            cart.items[itemIndex].flashSaleItem = activeDeal?.item._id || null;
        } else {
            cart.items.push({
                product: product._id,
                quantity: requestedQuantity,
                price: currentPrice,
                flashSale: activeDeal?.sale._id || null,
                flashSaleItem: activeDeal?.item._id || null
            });
        }

        cart.totalPrice = calculateTotal(cart.items);
        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate("items.product");
        res.json({
            success: true,
            message: "Thêm vào giỏ hàng thành công",
            data: populatedCart
        });
    } catch (error) {
        res.status(400).json({
            success: false, 
            message: "Lỗi thêm vào giỏ hàng",
            error: error.message
        });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const {quantity} = req.body;
        const {productId} = req.params;
        const cart = await Cart.findOne({user: req.user._id});
        if(!cart) return res.status(404).json({
            success: false,
            message: "Không tìm thấy giỏ hàng"
        });
        const item = cart.items.find((item) => item.product.toString() === productId);
        if(!item) return res.status(404).json({
            success: false,
            message: "Sản phẩm không có trong giỏ hàng"
        });
        item.quantity = Number(quantity);
        if(!Number.isInteger(item.quantity)) {
            return res.status(400).json({success: false, message: "Số lượng sản phẩm không hợp lệ"});
        }
        const product = await Product.findById(productId);
        if(!product) {
            return res.status(404).json({success: false, message: "Sản phẩm không còn tồn tại"});
        }
        if(item.quantity > product.stock) {
            return res.status(400).json({success: false, message: "Số lượng vượt quá tồn kho"});
        }
        const activeDeal = await getActiveDealItem(product._id);
        const currentPrice = activeDeal?.item.dealPrice || product.price;
        if(activeDeal && item.quantity > activeDeal.item.quantity - activeDeal.item.sold) {
            return res.status(400).json({success: false, message: "Số lượng vượt quá suất ưu đãi còn lại"});
        }
        item.price = currentPrice;
        item.flashSale = activeDeal?.sale._id || null;
        item.flashSaleItem = activeDeal?.item._id || null;
        if(item.quantity <= 0) {
            cart.items = cart.items.filter((item) => item.product.toString() !== productId);
        }
        cart.totalPrice = calculateTotal(cart.items);
        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate("items.product");
        res.json({
            success: true,
            message: "Cập nhật giỏ hàng thành công",
            data: populatedCart
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Lỗi cập nhật giỏ hàng",
            error: error.message
        });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const {productId} = req.params;
        const cart = await Cart.findOne({user: req.user._id});
        if(!cart) return res.status(404).json({
            success: false, 
            message: "Không tìm thấy giỏ hàng"
        });

        cart.items = cart.items.filter((item) => item.product.toString() !== productId);
        cart.totalPrice = calculateTotal(cart.items);
        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate("items.product");
        res.json({
            success: true, 
            message: "Xóa sản phẩm khỏi giỏ hàng thành công",
            data: populatedCart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa sản phẩm khỏi giỏ hàng",
            error: error.message
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({user: req.user._id});
        if(!cart) {
            return res.json({
                success: true, 
                message: "Giỏ hàng đã trống"
            });
        }
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();
        res.json({
            success: true,
            message: "Đã xóa toàn bộ giỏ hàng",
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa giỏ hàng",
            error: error.message
        });
    }
};
