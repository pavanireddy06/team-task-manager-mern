import express from "express";
import { protect } from "../middleware/auth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const projectFilter = req.user.role === "admin" ? {} : { members: req.user._id };
  const taskFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const now = new Date();

  const [totalProjects, totalTasks, pending, inProgress, completed, overdue, upcomingTasks] = await Promise.all([
    Project.countDocuments(projectFilter),
    Task.countDocuments(taskFilter),
    Task.countDocuments({ ...taskFilter, status: "pending" }),
    Task.countDocuments({ ...taskFilter, status: "in-progress" }),
    Task.countDocuments({ ...taskFilter, status: "completed" }),
    Task.countDocuments({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: "completed" } }),
    Task.find({ ...taskFilter, status: { $ne: "completed" } })
      .populate([
        { path: "project", select: "name" },
        { path: "assignedTo", select: "name email" }
      ])
      .sort({ dueDate: 1 })
      .limit(5)
  ]);

  res.json({
    totalProjects,
    totalTasks,
    statusCounts: { pending, inProgress, completed },
    overdue,
    upcomingTasks
  });
});

export default router;
