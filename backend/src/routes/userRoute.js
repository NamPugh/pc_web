import express from 'express';
import { authMe, getUsers, updateProfile, updateUserByAdmin } from '../controller/userController.js';
import { adminOnly, protectedRoute } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get("/me", protectedRoute, authMe);
router.put("/me", protectedRoute, updateProfile);
router.get("/", protectedRoute, adminOnly, getUsers);
router.patch("/:id/admin", protectedRoute, adminOnly, updateUserByAdmin);

export default router;
