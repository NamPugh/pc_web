import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  { _id: false }
);

const pcBuildSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      default: "Cấu hình PC của tôi"
    },
    components: {
      cpu: componentSchema,
      mainboard: componentSchema,
      ram: componentSchema,
      ssd: componentSchema,
      hdd: componentSchema,
      gpu: componentSchema,
      psu: componentSchema,
      case: componentSchema,
      cooler: componentSchema,
      monitor: componentSchema,
      keyboard: componentSchema,
      mouse: componentSchema,
      headphone: componentSchema
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const PCBuild = mongoose.model("PCBuild", pcBuildSchema);
export default PCBuild;

