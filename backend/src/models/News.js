import mongoose from "mongoose";
const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    thumbnail: {
      type: String,
      default: ""
    },
    summary: {
      type: String,
      default: ""
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);
export default News;
