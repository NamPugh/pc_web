import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.resolve("uploads", "banners");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extensionByMimeType[file.mimetype]}`);
  }
});

export const uploadBannerImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF"));
      return;
    }
    callback(null, true);
  }
});
