import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", protect, requireAdmin, async (req, res) => {
  const users = await User.find().select("-password").sort({ name: 1 });
  res.json(users);
});

export default router;
