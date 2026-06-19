import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    price: {
      type: Number,
      required: [true, "Giá sản phẩm là bắt buộc"],
      min: 0
    },
    oldPrice: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null
    },
    images: [
      {
        type: String
      }
    ],
    description: {
      type: String,
      default: ""
    },
    productType: {
      type: String,
      enum: [
        "cpu",
        "mainboard",
        "ram",
        "ssd",
        "hdd",
        "gpu",
        "psu",
        "case",
        "cooler",
        "monitor",
        "keyboard",
        "mouse",
        "headphone",
        "laptop",
        "pc",
        "other"
      ],
      default: "other"
    },
    specs: {
      type: Object,
      default: {}
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isDeal: {
      type: Boolean,
      default: false
    },
    dealPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    dealStartAt: {
      type: Date,
      default: null
    },
    dealEndAt: {
      type: Date,
      default: null
    },
    dealQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    dealSold: {
      type: Number,
      default: 0,
      min: 0
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
