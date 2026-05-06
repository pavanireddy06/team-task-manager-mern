import express from "express";
import mongoose from "mongoose";
import { protect, requireAdmin } from "../middleware/auth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = express.Router();

const populateTask = [
  { path: "project", select: "name description members" },
  { path: "assignedTo", select: "name email role" }
];

function taskQueryFor(user, query) {
  const filters = {};

  if (user.role !== "admin") {
    filters.assignedTo = user._id;
  }

  if (query.status) filters.status = query.status;
  if (query.project) filters.project = query.project;
  if (query.assignedTo && user.role === "admin") filters.assignedTo = query.assignedTo;
  if (query.overdue === "true") {
    filters.dueDate = { $lt: new Date() };
    filters.status = { $ne: "completed" };
  }

  return filters;
}

router.get("/", protect, async (req, res) => {
  const tasks = await Task.find(taskQueryFor(req.user, req.query))
    .populate(populateTask)
    .sort({ dueDate: 1, createdAt: -1 });
  res.json(tasks);
});

router.post("/", protect, requireAdmin, async (req, res) => {
  try {
    const { title, description = "", project, assignedTo, status = "pending", priority = "medium", dueDate } = req.body;

    if (!title || !project || !assignedTo || !dueDate) {
      return res.status(400).json({ message: "Title, project, assignee and due date are required" });
    }

    const parentProject = await Project.findById(project);
    if (!parentProject) return res.status(404).json({ message: "Project not found" });

    const memberIds = parentProject.members.map((member) => member.toString());
    if (!memberIds.includes(assignedTo)) {
      parentProject.members.push(assignedTo);
      await parentProject.save();
    }

    const task = await Task.create({ title, description, project, assignedTo, status, priority, dueDate });
    const populated = await task.populate(populateTask);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  const task = await Task.findById(req.params.id).populate(populateTask);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (req.user.role !== "admin" && task.assignedTo._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only view assigned tasks" });
  }

  res.json(task);
});

router.put("/:id", protect, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (req.user.role !== "admin" && task.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update assigned tasks" });
  }

  const allowed = req.user.role === "admin"
    ? ["title", "description", "project", "assignedTo", "status", "priority", "dueDate"]
    : ["status"];

  for (const field of allowed) {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  }

  await task.save();
  const populated = await task.populate(populateTask);
  res.json(populated);
});

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted" });
});

export default router;
