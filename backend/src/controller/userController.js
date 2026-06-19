import User from "../models/User.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error('lỗi khi gọi authMe', error);
        return res.status(500).json({message: 'Lỗi hệ thống'});
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userName = String(req.body.userName || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const phone = String(req.body.phone || "").trim();
        const address = String(req.body.address || "").trim();

        if (!userName || !email) {
            return res.status(400).json({ message: "Tên người dùng và email là bắt buộc" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }

        if (phone && !/^[0-9+\s().-]{8,20}$/.test(phone)) {
            return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
        }

        const emailOwner = await User.findOne({
            email,
            _id: { $ne: req.user._id }
        });

        if (emailOwner) {
            return res.status(409).json({ message: "Email đã được sử dụng bởi tài khoản khác" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { userName, email, phone, address },
            { new: true, runValidators: true }
        ).select("-hashedPassword");

        return res.status(200).json({
            message: "Cập nhật thông tin thành công",
            user
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin tài khoản", error);
        return res.status(500).json({ message: "Không thể cập nhật thông tin tài khoản" });
    }
};
