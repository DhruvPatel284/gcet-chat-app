// routes/user.route.js
import express from "express";
import { updateProfile, getUserProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET user profile
router.get("/:userId", protectRoute, getUserProfile);

// UPDATE user profile
router.put("/:userId", protectRoute, updateProfile);

export default router;