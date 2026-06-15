import express from 'express';
import { getComponentsByType,
        saveBuild,
        getMyBuilds,
        getBuildById,
        addBuildToCart,
        deleteBuild
 } from '../controller/buildPcController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get("/components/:productType", getComponentsByType);
router.post("/save", protectedRoute, saveBuild);
router.get("/my-builds", protectedRoute, getMyBuilds);
router.get("/:id", protectedRoute, getBuildById);
router.post("/:id/add-to-cart", protectedRoute, addBuildToCart);
router.delete("/:id", protectedRoute, deleteBuild);

export default router;