import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        hashedPassword: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            sparse: true
        },
        address: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        avatarUrl: {
            type: String,
        },
        avatarId: {
            type: String,
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;