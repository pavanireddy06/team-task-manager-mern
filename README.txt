Team Task Manager
=================

A full-stack MERN application for creating projects, assigning tasks, tracking progress, and managing role-based access for Admin and Member users.

Features
--------

- Signup and login with JWT authentication.
- Admin and Member roles.
- Admins can create, update, and delete projects and tasks.
- Members can view assigned work and update their own task status.
- Dashboard with project count, task count, status counts, overdue count, and upcoming tasks.
- Task filtering by status, project, assignee, and overdue state.
- MongoDB data models with relationships between users, projects, and tasks.
- Railway-ready production configuration.

Tech Stack
----------

- Frontend: React, Vite, CSS, lucide-react
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- Deployment target: Railway

Local Setup
-----------

Install dependencies:

npm run install:all

Create server/.env from server/.env.example:

PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173

Create client/.env from client/.env.example:

VITE_API_URL=http://localhost:5000/api

Run both apps:

npm run dev

Frontend: http://localhost:5173
Backend health check: http://localhost:5000/api/health

Demo Credentials
----------------

This app allows role selection during signup for assessment/demo use.

Recommended demo setup:

- Create one Admin account from the signup page.
- Create one Member account from the signup page.
- Log in as Admin, create a project, assign the Member, and create tasks for that Member.
- Log in as Member to update assigned task statuses.

API Overview
------------

Base path: /api

POST   /auth/signup      Public
POST   /auth/login       Public
GET    /auth/me          Authenticated
GET    /users            Admin
GET    /projects         Authenticated
POST   /projects         Admin
GET    /projects/:id     Authenticated
PUT    /projects/:id     Admin
DELETE /projects/:id     Admin
GET    /tasks            Authenticated
POST   /tasks            Admin
GET    /tasks/:id        Authenticated
PUT    /tasks/:id        Admin or assigned Member for status only
DELETE /tasks/:id        Admin
GET    /dashboard        Authenticated

Railway Deployment
------------------

You can deploy as one Railway service from the repository root.

1. Create a MongoDB Atlas database or Railway MongoDB plugin.
2. Add these Railway environment variables:
   - MONGO_URI
   - JWT_SECRET
   - CLIENT_URL set to your Railway app URL after deployment
3. Use the root build command:

npm run build

4. Use the root start command:

npm start

The server serves the built React app from client/dist in production.

Submission Checklist
--------------------

- Live Application URL from Railway.
- GitHub repository link.
- README file.
- 2-5 minute demo video showing Admin and Member workflows.
