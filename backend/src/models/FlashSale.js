import mongoose from "mongoose";

const flashSaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  dealPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  }
});

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    startAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft"
    },
    items: [flashSaleItemSchema]
  },
  { timestamps: true }
);

const FlashSale = mongoose.model("FlashSale", flashSaleSchema);
export default FlashSale;
