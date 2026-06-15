import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { 
    addToCart,
    removeCartItem,
    updateCartItem,
    clearCart,
    getCart
} from '../controller/cartController.js';


const router = express.Router();

router.use(protectedRoute);
router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:productId", updateCartItem);
router.delete("/remove/:productId", removeCartItem);
router.delete("/clear", clearCart);
export default router;