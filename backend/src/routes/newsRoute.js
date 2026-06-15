import express from 'express';
import { createNews,
        getNewsById,
        getNewsBySlug,
        getNewsList,
        updateNews,
        deleteNews
 } from '../controller/newsController.js';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get("/", getNewsList);
router.get("/slug/:slug", getNewsBySlug);
router.get("/:id", getNewsById);
router.post("/", protectedRoute, adminOnly, createNews);
router.put("/:id", protectedRoute, adminOnly, updateNews);
router.delete("/:id", protectedRoute, adminOnly, deleteNews);

export default router;