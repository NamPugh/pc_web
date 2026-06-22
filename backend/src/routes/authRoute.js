import express from 'express';
import { signUp } from '../controller/authController.js';
import { signIn } from '../controller/authController.js';
import { signOut } from '../controller/authController.js';
import { googleSignIn } from '../controller/authController.js';
const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/google", googleSignIn);
router.post("/signout", signOut);
export default router;
