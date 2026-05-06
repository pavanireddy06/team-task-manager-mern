import express from "express";
import mongoose from "mongoose";
import { protect, requireAdmin } from "../middleware/auth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = express.Router();

const populateProject = [
  { path: "createdBy", select: "name email role" },
  { path: "members", select: "name email role" }
];

function projectQueryFor(user) {
  if (user.role === "admin") return {};
  return { members: user._id };
}

router.get("/", protect, async (req, res) => {
  const projects = await Project.find(projectQueryFor(req.user))
    .populate(populateProject)
    .sort({ createdAt: -1 });
  res.json(projects);
});

router.post("/", protect, requireAdmin, async (req, res) => {
  try {
    const { name, description = "", members = [] } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const uniqueMembers = [...new Set(members.filter(Boolean))];
    const project = await Project.create({
      name,
      description,
      members: uniqueMembers,
      createdBy: req.user._id
    });

    const populated = await project.populate(populateProject);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid project id" });
  }

  const project = await Project.findOne({ _id: req.params.id, ...projectQueryFor(req.user) }).populate(populateProject);
  if (!project) return res.status(404).json({ message: "Project not found" });

  res.json(project);
});

router.put("/:id", protect, requireAdmin, async (req, res) => {
  const { name, description, members } = req.body;
  const update = {};

  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (members !== undefined) update.members = [...new Set(members.filter(Boolean))];

  const project = await Project.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  }).populate(populateProject);

  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json(project);
});

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  await Task.deleteMany({ project: req.params.id });
  res.json({ message: "Project and related tasks deleted" });
});

export default router;
