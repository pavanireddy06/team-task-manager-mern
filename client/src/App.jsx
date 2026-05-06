import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  LogOut,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, clearSession, getStoredUser, setSession } from "./api.js";

const emptyProjectForm = { name: "", description: "", members: [] };
const emptyTaskForm = {
  title: "",
  description: "",
  project: "",
  assignedTo: "",
  status: "pending",
  priority: "medium",
  dueDate: ""
};

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function isOverdue(task) {
  return task.status !== "completed" && new Date(task.dueDate) < new Date();
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [filters, setFilters] = useState({ status: "", project: "", assignedTo: "", overdue: false });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  async function loadData() {
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      const [dashboardData, projectData, taskData, userData] = await Promise.all([
        api("/dashboard"),
        api("/projects"),
        api(`/tasks${taskQuery}`),
        isAdmin ? api("/users") : Promise.resolve([])
      ]);

      setDashboard(dashboardData);
      setProjects(projectData);
      setTasks(taskData);
      setUsers(userData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const taskQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.project) params.set("project", filters.project);
    if (filters.assignedTo && isAdmin) params.set("assignedTo", filters.assignedTo);
    if (filters.overdue) params.set("overdue", "true");
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [filters, isAdmin]);

  useEffect(() => {
    loadData();
  }, [user, taskQuery]);

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = authMode === "signup"
        ? authForm
        : { email: authForm.email, password: authForm.password };
      const data = await api(`/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data.token, data.user);
      setUser(data.user);
      setView("dashboard");
      setAuthForm({ name: "", email: "", password: "", role: "member" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    setDashboard(null);
    setProjects([]);
    setTasks([]);
    setUsers([]);
    setView("dashboard");
  }

  async function createProject(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify(projectForm)
      });
      setProjectForm(emptyProjectForm);
      await loadData();
      setMessage("Project created");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteProject(id) {
    setMessage("");
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      await loadData();
      setMessage("Project deleted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api("/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm)
      });
      setTaskForm(emptyTaskForm);
      await loadData();
      setMessage("Task created");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateTaskStatus(task, status) {
    setMessage("");
    try {
      await api(`/tasks/${task._id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTask(id) {
    setMessage("");
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      await loadData();
      setMessage("Task deleted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div>
            <p className="eyebrow">Team Task Manager</p>
            <h1>{authMode === "login" ? "Welcome back" : "Create your workspace account"}</h1>
          </div>

          <form onSubmit={handleAuth} className="stack">
            {authMode === "signup" && (
              <>
                <label>
                  Name
                  <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required />
                </label>
                <label>
                  Role
                  <select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </>
            )}
            <label>
              Email
              <input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" minLength="6" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required />
            </label>
            {message && <p className="notice">{message}</p>}
            <button className="primary" disabled={loading}>
              {loading ? "Working..." : authMode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <button className="link-button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <FolderKanban size={26} />
          <span>TaskFlow</span>
        </div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><ClipboardList size={18} />Dashboard</button>
          <button className={view === "projects" ? "active" : ""} onClick={() => setView("projects")}><FolderKanban size={18} />Projects</button>
          <button className={view === "tasks" ? "active" : ""} onClick={() => setView("tasks")}><CheckCircle2 size={18} />Tasks</button>
        </nav>
        <div className="profile">
          {isAdmin ? <ShieldCheck size={18} /> : <UserRound size={18} />}
          <div>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </div>
        <button className="ghost" onClick={logout}><LogOut size={18} />Log out</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isAdmin ? "Admin workspace" : "Member workspace"}</p>
            <h1>{view[0].toUpperCase() + view.slice(1)}</h1>
          </div>
          {loading && <span className="sync">Syncing...</span>}
        </header>

        {message && <p className="notice">{message}</p>}

        {view === "dashboard" && (
          <Dashboard dashboard={dashboard} tasks={tasks} />
        )}

        {view === "projects" && (
          <Projects
            isAdmin={isAdmin}
            projects={projects}
            users={users}
            form={projectForm}
            setForm={setProjectForm}
            createProject={createProject}
            deleteProject={deleteProject}
          />
        )}

        {view === "tasks" && (
          <Tasks
            isAdmin={isAdmin}
            tasks={tasks}
            users={users}
            projects={projects}
            form={taskForm}
            setForm={setTaskForm}
            filters={filters}
            setFilters={setFilters}
            createTask={createTask}
            updateTaskStatus={updateTaskStatus}
            deleteTask={deleteTask}
          />
        )}
      </section>
    </main>
  );
}

function Dashboard({ dashboard, tasks }) {
  const cards = [
    ["Projects", dashboard?.totalProjects ?? 0, <FolderKanban size={22} />],
    ["Tasks", dashboard?.totalTasks ?? 0, <ClipboardList size={22} />],
    ["In progress", dashboard?.statusCounts?.inProgress ?? 0, <CalendarClock size={22} />],
    ["Overdue", dashboard?.overdue ?? 0, <CheckCircle2 size={22} />]
  ];

  return (
    <>
      <section className="metric-grid">
        {cards.map(([label, value, icon]) => (
          <article className="metric" key={label}>
            {icon}
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Next tasks</h2>
        <TaskList tasks={tasks.slice(0, 5)} onStatusChange={() => {}} readonly />
      </section>
    </>
  );
}

function Projects({ isAdmin, projects, users, form, setForm, createProject, deleteProject }) {
  return (
    <div className="two-column">
      {isAdmin && (
        <section className="panel">
          <h2><Plus size={18} /> New project</h2>
          <form onSubmit={createProject} className="stack">
            <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label>
              Members
              <select multiple value={form.members} onChange={(event) => setForm({ ...form, members: [...event.target.selectedOptions].map((option) => option.value) })}>
                {users.map((member) => <option key={member._id} value={member._id}>{member.name} ({member.role})</option>)}
              </select>
            </label>
            <button className="primary">Create project</button>
          </form>
        </section>
      )}

      <section className="panel wide">
        <h2>Project list</h2>
        <div className="list">
          {projects.map((project) => (
            <article className="item" key={project._id}>
              <div>
                <h3>{project.name}</h3>
                <p>{project.description || "No description"}</p>
                <span><UsersRound size={14} /> {project.members?.length || 0} members</span>
              </div>
              {isAdmin && <button className="danger" onClick={() => deleteProject(project._id)}>Delete</button>}
            </article>
          ))}
          {!projects.length && <p className="empty">No projects yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Tasks({ isAdmin, tasks, users, projects, form, setForm, filters, setFilters, createTask, updateTaskStatus, deleteTask }) {
  return (
    <div className="two-column">
      {isAdmin && (
        <section className="panel">
          <h2><Plus size={18} /> New task</h2>
          <form onSubmit={createTask} className="stack">
            <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
            <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label>
              Project
              <select value={form.project} onChange={(event) => setForm({ ...form, project: event.target.value })} required>
                <option value="">Select project</option>
                {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
              </select>
            </label>
            <label>
              Assignee
              <select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} required>
                <option value="">Select member</option>
                {users.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
              </select>
            </label>
            <div className="form-row">
              <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
              <label>Due date<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required /></label>
            </div>
            <button className="primary">Create task</button>
          </form>
        </section>
      )}

      <section className="panel wide">
        <h2>Task board</h2>
        <div className="filters">
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
            <option value="">All projects</option>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
          </select>
          {isAdmin && (
            <select value={filters.assignedTo} onChange={(event) => setFilters({ ...filters, assignedTo: event.target.value })}>
              <option value="">All assignees</option>
              {users.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
            </select>
          )}
          <label className="checkbox"><input type="checkbox" checked={filters.overdue} onChange={(event) => setFilters({ ...filters, overdue: event.target.checked })} />Overdue</label>
        </div>
        <TaskList tasks={tasks} isAdmin={isAdmin} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
      </section>
    </div>
  );
}

function TaskList({ tasks, isAdmin, onStatusChange, onDelete, readonly = false }) {
  return (
    <div className="list">
      {tasks.map((task) => (
        <article className={`item task ${isOverdue(task) ? "overdue" : ""}`} key={task._id}>
          <div>
            <h3>{task.title}</h3>
            <p>{task.description || "No description"}</p>
            <div className="meta">
              <span>{task.project?.name || "Project"}</span>
              <span>{task.assignedTo?.name || "Assignee"}</span>
              <span>{formatDate(task.dueDate)}</span>
              <span className={`pill ${task.priority}`}>{task.priority}</span>
            </div>
          </div>
          {!readonly && (
            <div className="task-actions">
              <select value={task.status} onChange={(event) => onStatusChange(task, event.target.value)}>
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              {isAdmin && <button className="danger" onClick={() => onDelete(task._id)}>Delete</button>}
            </div>
          )}
        </article>
      ))}
      {!tasks.length && <p className="empty">No tasks found.</p>}
    </div>
  );
}
