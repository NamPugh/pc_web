import express from 'express';
import { authMe, updateProfile } from '../controller/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get("/me", protectedRoute, authMe);
router.put("/me", protectedRoute, updateProfile);

export default router;
