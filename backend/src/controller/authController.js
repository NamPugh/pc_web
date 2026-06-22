import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { OAuth2Client } from "google-auth-library";
const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

const issueSession = async (res, user) => {
    // Tạo access token
    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );
    // Tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });
    // Kiểm tra môi trường production
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: REFRESH_TOKEN_TTL
    });

    return accessToken;
};

export const signUp = async (req, res) => {
    try {
        const {userName, password, email} = req.body;
        if(!userName || !password || !email) {
            return res.status(400).json({message: 
                "Không thể thiếu username, password, email"
            });
        }
        // Kiểm tra xem rmail tồn tại chưa
        const duplicate = await User.findOne({email});
        if(duplicate) {
            return res.status(409).json({message: "email đã được sử dụng"});
        }
        // mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);
        // tọa user mới
        await User.create({
            userName, 
            hashedPassword,
            email,
            authProviders: ["local"]
        });
        // return
        return res.sendStatus(204);
    } catch (error) {
        console.log("Lỗi khi gọi signUp", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const signIn = async (req, res) => {
    try {
        // Lấy inputs
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({message: "Thiếu email hoặc password"});
        }
        // Lấy hashedPassword
        const user = await User.findOne({email});
        if(!user) {
            return res.status(401).json({message: "Email hoặc password không chính xác"});
        }
        if (user.isActive === false) {
            return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên" });
        }
        if (!user.hashedPassword) {
            return res.status(401).json({message: "Tài khoản này đang sử dụng đăng nhập Google"});
        }
        // Kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect) {
            return res.status(401).json({message: "Email hoặc password không chính xác"});
        }
        const accessToken = await issueSession(res, user);
        return res.status(200).json({message: `User ${user.userName} đã logged in`, accessToken});
    } catch (error) {
        console.log("Lỗi khi gọi signIn", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const signOut = async (req, res) => {
    try {
        // Lấy refresh token trong cookie
        const token = req.cookies?.refreshToken;
        if(token) {
            await Session.deleteOne({refreshToken: token});
            res.clearCookie("refreshToken");
        }
        // xóa refresh token trong session

        // xóa cookie
        return res.sendStatus(204);
    } catch (error) {
        console.log("Lỗi khi gọi signOut", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const googleSignIn = async (req, res) => {
    try {
        const credential = String(req.body.credential || "").trim();
        const clientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();

        if (!clientId) {
            return res.status(503).json({ message: "Đăng nhập Google chưa được cấu hình trên máy chủ" });
        }
        if (!credential) {
            return res.status(400).json({ message: "Thiếu thông tin xác thực Google" });
        }

        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            return res.status(401).json({ message: "Tài khoản Google không hợp lệ hoặc email chưa được xác minh" });
        }

        const email = payload.email.toLowerCase().trim();
        let user = await User.findOne({
            $or: [{ googleId: payload.sub }, { email }]
        });

        if (user) {
            if (user.isActive === false) {
                return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên" });
            }
            if (user.googleId && user.googleId !== payload.sub) {
                return res.status(409).json({ message: "Email này đã được liên kết với tài khoản Google khác" });
            }
            user.googleId = payload.sub;
            user.authProviders = [...new Set([...(user.authProviders || []), "google"])];
            if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
            await user.save();
        } else {
            user = await User.create({
                userName: payload.name || email.split("@")[0],
                email,
                googleId: payload.sub,
                authProviders: ["google"],
                avatarUrl: payload.picture || ""
            });
        }

        const accessToken = await issueSession(res, user);
        return res.status(200).json({
            message: "Đăng nhập Google thành công",
            accessToken
        });
    } catch (error) {
        console.error("Lỗi khi đăng nhập Google:", error);
        return res.status(401).json({ message: "Không thể xác minh tài khoản Google" });
    }
};
