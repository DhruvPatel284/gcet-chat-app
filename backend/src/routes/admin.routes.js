// routes/adminRoutes.js
import express from "express";
import { createUser, deleteUser, getAllUsers , toggleAdminStatus } from "../controllers/admin.controller.js";
import adminMiddleware from "../middleware/adminMiddleware.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all admin routes with authentication and admin check
router.use(protectRoute)
router.use(adminMiddleware);

router.post("/create-user", createUser);
router.delete("/delete-user/:id", deleteUser);
router.get("/users", getAllUsers);
router.patch("/toggle-admin/:id", toggleAdminStatus);

export default router;