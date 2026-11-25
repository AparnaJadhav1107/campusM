# Smart Campus Management System

Full-stack web application demonstrating Fundamentals of Data Structures through real campus workflows: complaints (Queue + Priority Queue/heap), complaint history (Singly Linked List), undo (Stack), student lookup (Hash Table), student ordering (Binary Search Tree), and campus navigation (Graph + Dijkstra).

> Demo data: the server seeds clearly-labelled DEMO data (12 students, 12 complaints) so the dashboard works immediately. Real records created through the UI/API sit alongside it.

## Problem & Objectives
Centralise campus administration — students, complaints, priorities, resources, activity history — while making each data structure's working visible in a DSA Visualizer lab, with role-based access (Admin / Student), analytics, and reports.

## Technology Stack
Frontend: React.js (Vite, JavaScript ES6+), Tailwind CSS, Zustand, Radix UI, React Router DOM, Lucide React, Recharts.
Backend: Node.js, Express.js, JavaScript. Database: MongoDB Atlas via Mongoose (with in-memory demo fallback, see below). Tools: Git, GitHub, npm, Postman.

## Features
Auth (bcrypt + JWT, role-based), Student CRUD + hash lookup + dept filter/sort, Complaint submit/list/detail/status workflow, FIFO Complaint Queue, Binary-Heap Priority Queue, Linked-List history, Stack undo (status changes/assignments only — not every operation is undoable), Hash Table / BST / Graph visualizers + APIs, Dashboard analytics from API data, Reports with date filters + CSV export, Activity History, Campus Resources with Dijkstra shortest path, fully responsive (mobile drawer sidebar, single-column cards, scrollable tables). Styling: Tailwind + ONE global CSS file `client/src/index.css` only.

## DSA Implementation Details & Complexity
| Structure | Where | Operations (time) | Space |
|---|---|---|---|
| Array | Visualizer, lists | access O(1), insert/delete O(n) | O(n) |
| Stack | Undo (server/dsa + client) | push/pop/peek O(1) | O(n) |
| Queue | Complaint queue (FIFO) | enqueue/dequeue O(1) amortised | O(n) |
| Priority Queue (Binary Heap) | Priority requests; Critical>High>Medium>Low, FIFO tie-break | insert/extract O(log n), peek O(1) | O(n) |
| Singly Linked List | Complaint history / activity | insert head O(1), insert end/search/delete O(n) | O(n) |
| Hash Table | Student ID index, separate chaining, polynomial (x31) hash | avg O(1), worst O(n) | O(n) |
| BST | Students keyed by numeric Student ID; inorder/preorder/postorder, min/max | avg O(log n), worst O(n) | O(n) |
| Graph | Campus locations, undirected weighted | BFS/DFS O(V+E), Dijkstra O((V+E) log V) | O(V+E) |

Custom DSA modules live in BOTH `server/dsa/` and `client/src/dsa/` and are actually used — MongoDB is persistence, not a substitute for them.

## Architecture & Folder Structure
```
campusM/ (repo root = project root)
|-- client/  Vite React: src/{components/layout, pages, store, services, dsa}, routing in src/main.jsx
|-- server/  Express: config/db.js, models/, routes/api.js, middleware/auth.js, services/store.js (seed + DSA state), dsa/, tests/, app.js, server.js, seed.js
|-- .env.example  README.md  .gitignore  package.json (convenience scripts)
```

## Database Schema Overview
Users(name, unique email, hashed password, role), Students(unique studentId, fullName, unique email, phone, department, course, year, status), Complaints(complaintId, student ref, category enum, location, priority enum, status enum, assignedTo, adminNotes), ComplaintHistory(complaintId, action, previous/new status, adminId), CampusLocations(name), ActivityLogs(action, actor, detail). Timestamps + unique indexes via Mongoose in `server/models/index.js`. ComplaintAssignments/Notifications state is held in `server/services/store.js`.

## API Documentation (envelope `{success, data, message}`)
Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout.
Students: GET/POST /api/students, GET/PUT/DELETE /api/students/:id.
Complaints: GET/POST /api/complaints, GET/PUT/DELETE /api/complaints/:id, PATCH /api/complaints/:id/status, GET /api/complaints/:id/history.
Queue: GET /api/queue, POST /api/queue/enqueue, POST /api/queue/dequeue.
Priority: GET /api/priority-queue, POST /api/priority-queue/insert, POST /api/priority-queue/extract.
Undo: POST /api/undo, GET /api/dsa/undo-stack. Dashboard: GET /api/dashboard/overview, GET /api/dashboard/analytics, GET /api/reports, GET /api/reports/export.csv.
Campus: GET /api/campus/graph, GET /api/campus/resources, POST /api/campus/graph/vertices, POST /api/campus/graph/edges, POST /api/campus/graph/shortest-path.
DSA: GET /api/dsa/hash-table, GET /api/dsa/bst. Health: GET /api/health.

## Installation & Environment (MongoDB Atlas)
1. Atlas: create a free cluster at mongodb.com/atlas, Database Access: add a DB user, Network Access: allow your IP (or 0.0.0.0/0 for dev), Connect > Drivers > copy the `mongodb+srv://...` string.
2. Env files:
   ```
   cp server/.env.example server/.env   # fill MONGODB_URI, strong JWT_SECRET, admin credentials
   cp client/.env.example client/.env   # VITE_API_URL default http://localhost:5000/api
   ```
   Server vars: PORT=5000, NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN=7d, CLIENT_URL=http://localhost:5173, BCRYPT_SALT_ROUNDS=10, ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD, DEMO_STUDENT_EMAIL/DEMO_STUDENT_PASSWORD. Client var: VITE_API_URL. Never commit `.env` (gitignored). If MONGODB_URI is missing/placeholder/unreachable, the server logs the exact Mongoose error and runs in seeded in-memory DEMO mode; with a valid URI it connects to Atlas.
3. Install: `npm run install:all` from the repo root.

## How to Run
Backend:
```
cd server && npm install && npm run seed && npm run dev   # http://localhost:5000 — health: /api/health
```
Frontend (second terminal):
```
cd client && npm install && npm run dev                  # http://localhost:5173
```
Seeded logins (defaults from .env.example, change in server/.env): Admin `admin@campus.edu` / `Admin@123`; Student `student@campus.edu` / `Student@123`.

## Testing
```
cd server && npm test      # node:test — Stack, Queue, Priority Queue ordering/tie-break, Linked List, Hash Table, BST, Graph BFS/DFS/Dijkstra
cd client && npm run build
```

## Future Enhancements
Full Mongo persistence for queue/history state, image uploads for complaints, email notifications, refresh-token rotation, E2E tests.
