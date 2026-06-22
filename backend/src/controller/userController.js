import User from "../models/User.js";
import Session from "../models/Session.js";

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

export const getUsers = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
        const search = String(req.query.search || "").trim();
        const role = String(req.query.role || "all");
        const status = String(req.query.status || "all");
        const filter = {};

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            filter.$or = [
                { userName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        if (role === "user" || role === "admin") filter.role = role;
        if (status === "active") filter.isActive = { $ne: false };
        if (status === "inactive") filter.isActive = false;

        const [users, total, totalUsers, totalAdmins, inactiveUsers] = await Promise.all([
            User.find(filter)
                .select("-hashedPassword")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
            User.countDocuments(),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ isActive: false })
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            total,
            currentPage: page,
            totalPages: Math.max(Math.ceil(total / limit), 1),
            summary: {
                totalUsers,
                totalAdmins,
                inactiveUsers,
                activeUsers: totalUsers - inactiveUsers
            },
            data: users
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng", error);
        return res.status(500).json({ message: "Không thể tải danh sách người dùng" });
    }
};

export const updateUserByAdmin = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const nextRole = req.body.role;
        const nextActive = req.body.isActive;
        const isCurrentAdmin = String(targetUser._id) === String(req.user._id);

        if (nextRole !== undefined && !["user", "admin"].includes(nextRole)) {
            return res.status(400).json({ message: "Vai trò người dùng không hợp lệ" });
        }
        if (nextActive !== undefined && typeof nextActive !== "boolean") {
            return res.status(400).json({ message: "Trạng thái tài khoản không hợp lệ" });
        }
        if (isCurrentAdmin && nextRole === "user") {
            return res.status(400).json({ message: "Bạn không thể tự hạ quyền quản trị của mình" });
        }
        if (isCurrentAdmin && nextActive === false) {
            return res.status(400).json({ message: "Bạn không thể tự khóa tài khoản của mình" });
        }

        if (nextRole !== undefined) targetUser.role = nextRole;
        if (nextActive !== undefined) targetUser.isActive = nextActive;
        await targetUser.save();

        if (nextActive === false) {
            await Session.deleteMany({ userId: targetUser._id });
        }

        const safeUser = await User.findById(targetUser._id).select("-hashedPassword");
        return res.status(200).json({
            success: true,
            message: "Đã cập nhật tài khoản",
            data: safeUser
        });
    } catch (error) {
        console.error("Lỗi khi quản trị tài khoản", error);
        return res.status(500).json({ message: "Không thể cập nhật tài khoản" });
    }
};
