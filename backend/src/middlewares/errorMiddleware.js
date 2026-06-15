const notFound = (req, res, next) => {
    res.status(400).json({
        success: false,
        message: `Không tìm thấy route: ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Lỗi server",
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
};

export default {errorHandler, notFound};