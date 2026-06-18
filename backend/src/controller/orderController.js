import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

export const createOrder = async (req, res) => {
  try {
    const { customerInfo, paymentMethod = "cod", note = "" } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Giỏ hàng đang trống" });
    }
 
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || "",
      price: item.price,
      quantity: item.quantity
    }));

    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      customerInfo,
      items: orderItems,
      totalPrice,
      paymentMethod,
      note
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, sold: item.quantity }
      });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi tạo đơn hàng", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy đơn hàng", error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "userName email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy tất cả đơn hàng", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.user = req.user._id;

    const order = await Order.findOne(filter).populate("user", "fullName email phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đơn hàng", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({ success: true, message: "Cập nhật trạng thái đơn hàng thành công", data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi cập nhật đơn hàng", error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái hiện tại"
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ success: true, message: "Hủy đơn hàng thành công", data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi hủy đơn hàng", error: error.message });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfLastSevenDays = new Date(startOfToday);
    startOfLastSevenDays.setDate(startOfLastSevenDays.getDate() - 6);

    const orders = await Order.find()
      .select("items totalPrice paymentStatus orderStatus createdAt")
      .lean();

    const activeOrders = orders.filter((order) => order.orderStatus !== "cancelled");
    const completedOrders = orders.filter((order) => order.orderStatus === "completed");
    const revenueOrders = orders.filter(
      (order) => order.orderStatus === "completed" || order.paymentStatus === "paid"
    );

    const revenue = revenueOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const monthRevenue = revenueOrders
      .filter((order) => new Date(order.createdAt) >= startOfMonth)
      .reduce((sum, order) => sum + order.totalPrice, 0);
    const previousMonthRevenue = revenueOrders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= startOfPreviousMonth && createdAt < startOfMonth;
      })
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const statusCounts = ["pending", "confirmed", "shipping", "completed", "cancelled"].reduce(
      (result, status) => {
        result[status] = orders.filter((order) => order.orderStatus === status).length;
        return result;
      },
      {}
    );

    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfLastSevenDays);
      date.setDate(date.getDate() + index);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = revenueOrders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= date && createdAt < nextDate;
      });

      return {
        date: date.toISOString(),
        revenue: dayOrders.reduce((sum, order) => sum + order.totalPrice, 0),
        orders: dayOrders.length
      };
    });

    const topProductMap = new Map();
    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product?.toString() || item.name;
        const current = topProductMap.get(key) || {
          product: item.product || null,
          name: item.name,
          image: item.image || "",
          quantity: 0,
          revenue: 0
        };
        current.quantity += item.quantity;
        current.revenue += item.price * item.quantity;
        topProductMap.set(key, current);
      });
    });

    const topProducts = [...topProductMap.values()]
      .sort((first, second) => second.quantity - first.quantity)
      .slice(0, 5);

    const thisMonthOrders = activeOrders.filter(
      (order) => new Date(order.createdAt) >= startOfMonth
    );

    res.json({
      success: true,
      data: {
        totalRevenue: revenue,
        monthRevenue,
        previousMonthRevenue,
        monthGrowth:
          previousMonthRevenue > 0
            ? ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : monthRevenue > 0
              ? 100
              : 0,
        totalOrders: activeOrders.length,
        monthOrders: thisMonthOrders.length,
        completedOrders: completedOrders.length,
        averageOrderValue:
          revenueOrders.length > 0 ? revenue / revenueOrders.length : 0,
        statusCounts,
        dailyRevenue,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê đơn hàng",
      error: error.message
    });
  }
};
