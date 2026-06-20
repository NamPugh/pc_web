import Product from "../models/Product.js";
import PCBuild from "../models/PCBuild.js";
import Cart from "../models/Cart.js";
import Category from "../models/Category.js";

const componentCategoryAliases = {
  cpu: ["cpu", "bo vi xu ly", "bộ vi xử lý"],
  mainboard: ["mainboard", "motherboard", "bo mach chu", "bo mạch chủ"],
  ram: ["ram", "bo nho trong", "bộ nhớ trong"],
  ssd: ["ssd", "o cung ssd", "ổ cứng ssd"],
  hdd: ["hdd", "o cung hdd", "ổ cứng hdd"],
  gpu: ["gpu", "vga", "card man hinh", "card màn hình"],
  psu: ["psu", "nguon may tinh", "nguồn máy tính", "bo nguon", "bộ nguồn"],
  case: ["case", "vo case", "vỏ case", "thung may", "thùng máy"],
  cooler: ["cooler", "tan nhiet", "tản nhiệt"],
  monitor: ["monitor", "man hinh", "màn hình"],
  keyboard: ["keyboard", "ban phim", "bàn phím"],
  mouse: ["mouse", "chuot", "chuột"],
  headphone: ["headphone", "headset", "tai nghe", "tai nghe"]
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const calculateBuildTotal = async (components) => {
  let total = 0;

  for (const key of Object.keys(components)) {
    const component = components[key];

    if (component && component.product) {
      const product = await Product.findById(component.product);

      if (product) {
        total += product.price * (component.quantity || 1);
      }
    }
  }

  return total;
};

export const getComponentsByType = async (req, res) => {
  try {
    const { productType } = req.params;
    const aliases = componentCategoryAliases[productType] || [productType];
    const aliasPattern = aliases.map(escapeRegex).join("|");
    const matchingCategories = await Category.find({
      $or: [
        { name: { $regex: aliasPattern, $options: "i" } },
        { slug: { $regex: aliasPattern.replaceAll(" ", "[-_ ]?"), $options: "i" } }
      ]
    }).select("_id");

    const products = await Product.find({
      status: "active",
      stock: { $gt: 0 },
      $or: [
        { productType },
        { productType: "other", category: { $in: matchingCategories.map((category) => category._id) } }
      ]
    })
      .populate("category", "name slug")
      .populate("brand", "name slug logo")
      .sort({ price: 1 });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy linh kiện", error: error.message });
  }
};

export const saveBuild = async (req, res) => {
  try {
    const { name, components, note } = req.body;

    if (!components?.cooler?.product) {
      return res.status(400).json({
        success: false,
        message: "Tản nhiệt là linh kiện bắt buộc"
      });
    }

    const totalPrice = await calculateBuildTotal(components || {});

    const build = await PCBuild.create({
      user: req.user._id,
      name,
      components,
      totalPrice,
      note
    });

    const populatedBuild = await PCBuild.findById(build._id)
      .populate("components.cpu.product")
      .populate("components.mainboard.product")
      .populate("components.ram.product")
      .populate("components.ssd.product")
      .populate("components.hdd.product")
      .populate("components.gpu.product")
      .populate("components.psu.product")
      .populate("components.case.product")
      .populate("components.cooler.product")
      .populate("components.monitor.product")
      .populate("components.keyboard.product")
      .populate("components.mouse.product")
      .populate("components.headphone.product");

    res.status(201).json({
      success: true,
      message: "Lưu cấu hình thành công",
      data: populatedBuild
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi lưu cấu hình", error: error.message });
  }
};

export const getMyBuilds = async (req, res) => {
  try {
    const builds = await PCBuild.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: builds.length, data: builds });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy cấu hình", error: error.message });
  }
};

export const getBuildById = async (req, res) => {
  try {
    const build = await PCBuild.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!build) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cấu hình" });
    }

    res.json({ success: true, data: build });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết cấu hình", error: error.message });
  }
};

export const addBuildToCart = async (req, res) => {
  try {
    const build = await PCBuild.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!build) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cấu hình" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
    }

    for (const key of Object.keys(build.components || {})) {
      const component = build.components[key];

      if (component && component.product) {
        const product = await Product.findById(component.product);

        if (product) {
          const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === product._id.toString()
          );

          if (itemIndex > -1) {
            cart.items[itemIndex].quantity += component.quantity || 1;
            cart.items[itemIndex].price = product.price;
          } else {
            cart.items.push({
              product: product._id,
              quantity: component.quantity || 1,
              price: product.price
            });
          }
        }
      }
    }

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate("items.product");

    res.json({
      success: true,
      message: "Đã thêm cấu hình vào giỏ hàng",
      data: populatedCart
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Lỗi thêm cấu hình vào giỏ hàng", error: error.message });
  }
};

export const deleteBuild = async (req, res) => {
  try {
    const build = await PCBuild.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!build) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cấu hình" });
    }

    res.json({ success: true, message: "Xóa cấu hình thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa cấu hình", error: error.message });
  }
};

