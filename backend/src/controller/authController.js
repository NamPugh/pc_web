import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
    try {
        const {userName, password, email} = req.body;
        if(!userName || !password || !email) {
            return res.status(400).json({message: 
                "Không thể thiếu username, password, email"
            });
        }
        // Kiểm tra xem username tồn tại chưa
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
        // Kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect) {
            return res.status(401).json({message: "Email hoặc password không chính xác"});
        }
        // nếu khớp, tạo accessToken với JWT
        const accessToken = jwt.sign({userId: user._id}, 
            process.env.ACCESS_TOKEN_SECRET, 
            {expiresIn: ACCESS_TOKEN_TTL})
        // tạo sesion mới để lưu refresh token
        const refreshToken = crypto.randomBytes(64).toString("hex");
        await Session.create({
            userId: user._id,
            refreshToken, 
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });
        // trả refresh token về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        })
        // trả access token về trong cookie
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