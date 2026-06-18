import mongoose from "mongoose";

const homeSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề khu vực là bắt buộc"],
      trim: true
    },
    keyword: {
      type: String,
      default: "",
      trim: true
    },
    bannerImage: {
      type: String,
      required: [true, "Ảnh banner là bắt buộc"],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Danh mục là bắt buộc"]
    },
    products: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        }
      ],
      validate: {
        validator: (products) => products.length <= 4,
        message: "Mỗi khu vực chỉ được hiển thị tối đa 4 sản phẩm"
      },
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const HomeSection = mongoose.model("HomeSection", homeSectionSchema);
export default HomeSection;
