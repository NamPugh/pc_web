import express from 'express';
import { updateProductRating,
        createReview,
        getProductReviews,
        deleteReview
 } from '../controller/reviewController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", protectedRoute, createReview);
router.delete("/:id", protectedRoute, deleteReview);

export default router;