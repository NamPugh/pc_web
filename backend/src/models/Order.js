import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    flashSale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlashSale",
      default: null
    },
    flashSaleItem: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    customerInfo: {
      fullName: String,
      phone: String,
      email: String,
      address: String
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "banking", "momo", "vnpay"],
      default: "cod"
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
      default: "pending"
    },
    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
