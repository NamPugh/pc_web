import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({user: req.user._id}).populate("items.product");
        // Không có cart thì tạo 1 cart mới 
        if(!cart) {
            cart = await Cart.create({user: req.user._id, items: [], totalPrice: 0});
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
        // kiểm tra sản phẩm đang thêm có trong giỏ hàng
        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );
        if(itemIndex > -1) {
            cart.items[itemIndex].quantity += Number(quantity);
            cart.items[itemIndex].price = product.price;
        } else {
            cart.items.push({
                product: product._id,
                quantity: Number(quantity),
                price: product.price
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