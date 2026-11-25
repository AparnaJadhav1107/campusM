import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  usersRepo,
  studentsRepo,
  complaintsRepo,
  graphRepo,
  addHistory,
  historyForComplaint,
  listActivity,
  listNotifications,
  buildQueue,
  buildPriorityQueue,
  buildStudentHash,
  buildStudentBST,
  undoStack,
  PENDING_STATUSES,
} from "../services/store.js";
import { isMongo } from "../config/db.js";
import { auth, adminOnly, ok, fail } from "../middleware/auth.js";

export const router = Router();

const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, studentRef: u.studentRef || null });
const sign = (u) =>
  jwt.sign({ id: u.id, email: u.email, role: u.role, name: u.name }, process.env.JWT_SECRET || "dev-secret-change-me", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/health", (req, res) =>
  ok(res, { status: "ok", mode: isMongo() ? "mongodb" : "in-memory", time: new Date().toISOString() }, "Healthy")
);

/* ---------------- AUTH ---------------- */
router.post(
  "/auth/register",
  wrap(async (req, res) => {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return fail(res, 400, "name, email and password are required");
    if (await usersRepo.findByEmail(email)) return fail(res, 409, "Email already registered");
    const u = await usersRepo.create({
      name,
      email: String(email).toLowerCase(),
      password: bcrypt.hashSync(password, parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10)),
      role: role === "admin" ? "admin" : "student",
    });
    ok(res, { user: pub(u), token: sign(u) }, "Registered", 201);
  })
);

router.post(
  "/auth/login",
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const u = await usersRepo.findByEmail(email);
    if (!u) return fail(res, 401, "Invalid email or password");
    if (!bcrypt.compareSync(password || "", u.password)) return fail(res, 401, "Invalid email or password");
    ok(res, { user: pub(u), token: sign(u) }, "Logged in");
  })
);

router.get(
  "/auth/me",
  auth,
  wrap(async (req, res) => {
    const u = await usersRepo.findById(req.user.id);
    if (!u) return fail(res, 404, "User not found");
    ok(res, pub(u));
  })
);
router.post("/auth/logout", auth, (req, res) => ok(res, null, "Logged out (discard token client-side)"));

/* ---------------- STUDENTS ---------------- */
router.get(
  "/students",
  auth,
  wrap(async (req, res) => {
    let list = await studentsRepo.list();
    const { search = "", department = "", sort = "studentId", page = 1, limit = 50 } = req.query;
    // Hash Table index built from the real student records — used for exact ID lookup.
    const hash = buildStudentHash(list);
    let hashLookup = null;
    if (search && /^\d+$/.test(String(search))) hashLookup = hash.get(Number(search)) || null;
    if (search) list = list.filter((s) => JSON.stringify(s).toLowerCase().includes(String(search).toLowerCase()));
    if (department) list = list.filter((s) => s.department === department);
    list.sort((a, b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), undefined, { numeric: true }));
    const total = list.length;
    list = list.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));
    ok(res, { items: list, total, page: Number(page), hashLookup });
  })
);

router.post(
  "/students",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const b = req.body || {};
    if (!b.studentId || !b.fullName || !b.email) return fail(res, 400, "studentId, fullName and email are required");
    if (await studentsRepo.findByStudentId(b.studentId)) return fail(res, 409, "Student ID already exists");
    const s = await studentsRepo.create({
      studentId: Number(b.studentId),
      fullName: b.fullName,
      email: b.email,
      phone: b.phone || "",
      department: b.department || "",
      course: b.course || "",
      year: b.year ? Number(b.year) : "",
      status: b.status || "Active",
    });
    ok(res, s, "Student created", 201);
  })
);

router.get(
  "/students/:id",
  auth,
  wrap(async (req, res) => {
    const students = await studentsRepo.list();
    const s = buildStudentHash(students).get(Number(req.params.id)) || (await studentsRepo.findByKey(req.params.id));
    if (!s) return fail(res, 404, "Student not found (hash table lookup)");
    ok(res, s);
  })
);

router.put(
  "/students/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const patch = { ...req.body };
    delete patch.id;
    if (patch.studentId) patch.studentId = Number(patch.studentId);
    const s = await studentsRepo.update(req.params.id, patch);
    if (!s) return fail(res, 404, "Student not found");
    ok(res, s, "Student updated");
  })
);

router.delete(
  "/students/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const s = await studentsRepo.remove(req.params.id);
    if (!s) return fail(res, 404, "Student not found");
    ok(res, s, "Student deleted");
  })
);

/* ---------------- COMPLAINTS ---------------- */
async function visibleComplaints(req) {
  let list = await complaintsRepo.list();
  if (req.user.role === "student") {
    const me = await usersRepo.findById(req.user.id);
    list = list.filter((c) => c.studentName === req.user.name || (me?.studentRef && c.studentId === Number(me.studentRef)));
  }
  return list;
}

router.get(
  "/complaints",
  auth,
  wrap(async (req, res) => {
    let list = await visibleComplaints(req);
    const { search = "", category = "", status = "", priority = "" } = req.query;
    if (search) list = list.filter((c) => JSON.stringify(c).toLowerCase().includes(String(search).toLowerCase()));
    if (category) list = list.filter((c) => c.category === category);
    if (status) list = list.filter((c) => c.status === status);
    if (priority) list = list.filter((c) => c.priority === priority);
    ok(res, { items: list, total: list.length });
  })
);

router.post(
  "/complaints",
  auth,
  wrap(async (req, res) => {
    const b = req.body || {};
    if (!b.category || !b.description) return fail(res, 400, "category and description are required");
    const me = await usersRepo.findById(req.user.id);
    const c = await complaintsRepo.create({
      complaintId: await complaintsRepo.nextComplaintId(),
      studentId: b.studentId ? Number(b.studentId) : me?.studentRef ? Number(me.studentRef) : null,
      studentName: b.studentName || req.user.name,
      category: b.category,
      description: b.description,
      location: b.location || "",
      priority: b.priority || "Medium",
      status: "Submitted",
      assignedTo: "",
      adminNotes: "",
    });
    await addHistory(c.complaintId, "Submitted", "", c.status, req.user.id);
    ok(res, c, "Complaint submitted", 201);
  })
);

router.get(
  "/complaints/:id/history",
  auth,
  wrap(async (req, res) => {
    ok(res, await historyForComplaint(req.params.id));
  })
);

router.get(
  "/complaints/:id",
  auth,
  wrap(async (req, res) => {
    const c = await complaintsRepo.findByKey(req.params.id);
    if (!c) return fail(res, 404, "Complaint not found");
    ok(res, c);
  })
);

router.put(
  "/complaints/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const patch = { ...req.body };
    delete patch.id;
    delete patch.complaintId;
    const c = await complaintsRepo.update(req.params.id, patch);
    if (!c) return fail(res, 404, "Complaint not found");
    ok(res, c, "Complaint updated");
  })
);

router.patch(
  "/complaints/:id/status",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const c = await complaintsRepo.findByKey(req.params.id);
    if (!c) return fail(res, 404, "Complaint not found");
    const next = req.body.status;
    if (!next) return fail(res, 400, "status is required");
    undoStack.push({ complaintId: c.complaintId, previousStatus: c.status, previousAssignedTo: c.assignedTo });
    const patch = { status: next };
    if (req.body.assignedTo !== undefined) patch.assignedTo = req.body.assignedTo;
    if (req.body.adminNotes !== undefined) patch.adminNotes = req.body.adminNotes;
    const updated = await complaintsRepo.update(c.complaintId, patch);
    await addHistory(c.complaintId, "Status Changed", c.status, next, req.user.id);
    ok(res, updated, "Status updated");
  })
);

router.delete(
  "/complaints/:id",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const c = await complaintsRepo.remove(req.params.id);
    if (!c) return fail(res, 404, "Complaint not found");
    ok(res, c, "Complaint deleted");
  })
);

/* ---------------- QUEUE / PRIORITY / UNDO / ACTIVITY ---------------- */
router.get(
  "/queue",
  auth,
  wrap(async (req, res) => {
    const queue = buildQueue(await complaintsRepo.list());
    ok(res, {
      items: queue.toArray().map((c, i) => ({ ...c, position: i + 1 })),
      size: queue.size(),
      peek: queue.peek() || null,
    });
  })
);

router.post(
  "/queue/enqueue",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const c = await complaintsRepo.findByKey(req.body.complaintId || "");
    if (!c) return fail(res, 404, "Complaint not found");
    const queue = buildQueue(await complaintsRepo.list());
    ok(res, { size: queue.size(), alreadyQueued: PENDING_STATUSES.includes(c.status) }, "Complaint is in the FIFO queue while pending");
  })
);

router.post(
  "/queue/dequeue",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const queue = buildQueue(await complaintsRepo.list());
    const front = queue.dequeue();
    if (!front) return fail(res, 400, "Queue is empty");
    undoStack.push({ complaintId: front.complaintId, previousStatus: front.status, previousAssignedTo: front.assignedTo });
    const updated = await complaintsRepo.update(front.complaintId, { status: "Under Review" });
    await addHistory(front.complaintId, "Dequeued — processing started", front.status, "Under Review", req.user.id);
    ok(res, updated, "Dequeued front complaint (FIFO) — now Under Review");
  })
);

router.get(
  "/priority-queue",
  auth,
  wrap(async (req, res) => {
    const pq = buildPriorityQueue(await complaintsRepo.list());
    ok(res, { items: pq.toArray(), size: pq.size(), peek: pq.peek() || null });
  })
);

router.post(
  "/priority-queue/insert",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const c = await complaintsRepo.findByKey(req.body.complaintId || "");
    if (!c) return fail(res, 404, "Complaint not found");
    const pq = buildPriorityQueue(await complaintsRepo.list());
    ok(res, { size: pq.size() }, "Complaint is in the priority heap while pending");
  })
);

router.post(
  "/priority-queue/extract",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const pq = buildPriorityQueue(await complaintsRepo.list());
    const top = pq.extractMax();
    if (!top) return fail(res, 400, "Priority queue is empty");
    undoStack.push({ complaintId: top.complaintId, previousStatus: top.status, previousAssignedTo: top.assignedTo });
    const updated = await complaintsRepo.update(top.complaintId, { status: "Assigned" });
    await addHistory(top.complaintId, "Extracted from priority queue — assigned", top.status, "Assigned", req.user.id);
    ok(res, updated, "Extracted highest priority complaint — now Assigned");
  })
);

router.post(
  "/undo",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const a = undoStack.pop();
    if (!a) return fail(res, 400, "Nothing to undo — undo stack is empty");
    const c = await complaintsRepo.findByKey(a.complaintId);
    if (!c) return fail(res, 404, "Complaint for undo action not found");
    const updated = await complaintsRepo.update(c.complaintId, {
      status: a.previousStatus,
      assignedTo: a.previousAssignedTo,
    });
    await addHistory(c.complaintId, "Undo", c.status, a.previousStatus, req.user.id);
    ok(res, updated, "Undid last status change");
  })
);

router.get(
  "/activity",
  auth,
  wrap(async (req, res) => {
    ok(res, await listActivity(100));
  })
);

router.get(
  "/notifications",
  auth,
  wrap(async (req, res) => {
    // Real notification: the current count of pending complaints, plus stored notifications.
    const complaints = await complaintsRepo.list();
    const pending = complaints.filter((c) => PENDING_STATUSES.includes(c.status)).length;
    const stored = await listNotifications(req.user.id);
    ok(res, { items: stored, pendingComplaints: pending });
  })
);

/* ---------------- DASHBOARD / REPORTS (all computed from real records) ---------------- */
function computeAnalytics(complaints, query = {}) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  let list = complaints;
  if (from) list = list.filter((c) => new Date(c.createdAt) >= from);
  if (to) list = list.filter((c) => new Date(c.createdAt) <= to);
  const byDay = {};
  list.forEach((c) => {
    const d = String(c.createdAt).slice(0, 10);
    byDay[d] = byDay[d] || { date: d, submitted: 0, resolved: 0 };
    byDay[d].submitted++;
    if (c.status === "Resolved") byDay[d].resolved++;
  });
  const countBy = (key) => {
    const m = {};
    list.forEach((c) => {
      m[c[key]] = (m[c[key]] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  };
  return {
    trend: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    categories: countBy("category"),
    priorities: countBy("priority"),
  };
}

router.get(
  "/dashboard/overview",
  auth,
  wrap(async (req, res) => {
    const [students, complaints, activity] = await Promise.all([
      studentsRepo.list(),
      complaintsRepo.list(),
      listActivity(8),
    ]);
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const deptMap = {};
    students.forEach((s) => {
      const d = s.department || "Unspecified";
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    ok(res, {
      totalStudents: students.length,
      totalComplaints: total,
      pendingComplaints: complaints.filter((c) => PENDING_STATUSES.includes(c.status)).length,
      resolvedComplaints: resolved,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      target: 90,
      recentComplaints: [...complaints].slice(-8).reverse(),
      priorityRequests: buildPriorityQueue(complaints).toArray(),
      studentsByDepartment: Object.entries(deptMap).map(([name, value]) => ({ name, value })),
      recentActivity: activity.items,
      funnel: ["Submitted", "Under Review", "Assigned", "Resolved", "Rejected"].map((stage) => ({
        stage,
        count: complaints.filter((c) => c.status === stage).length,
      })),
      ...computeAnalytics(complaints, req.query),
    });
  })
);

router.get(
  "/dashboard/analytics",
  auth,
  wrap(async (req, res) => {
    ok(res, computeAnalytics(await complaintsRepo.list(), req.query));
  })
);

router.get(
  "/reports",
  auth,
  wrap(async (req, res) => {
    const [students, complaints] = await Promise.all([studentsRepo.list(), complaintsRepo.list()]);
    const resolvedList = complaints.filter((c) => c.status === "Resolved");
    let avgResolutionDays = null;
    if (resolvedList.length) {
      const totalDays =
        resolvedList.reduce((sum, c) => sum + (new Date(c.updatedAt) - new Date(c.createdAt)) / 86400000, 0) /
        resolvedList.length;
      avgResolutionDays = Math.round(totalDays * 10) / 10;
    }
    const depts = {};
    complaints.forEach((c) => {
      const s = students.find((x) => x.studentId === c.studentId);
      const d = s?.department || "Unspecified";
      depts[d] = (depts[d] || 0) + 1;
    });
    ok(res, {
      ...computeAnalytics(complaints, req.query),
      total: complaints.length,
      resolved: resolvedList.length,
      pending: complaints.filter((c) => PENDING_STATUSES.includes(c.status)).length,
      departments: Object.entries(depts).map(([name, value]) => ({ name, value })),
      avgResolutionDays,
    });
  })
);

router.get(
  "/reports/export.csv",
  auth,
  wrap(async (req, res) => {
    const complaints = await complaintsRepo.list();
    const rows = [
      ["Complaint ID", "Student", "Category", "Priority", "Status", "Location", "Created"],
      ...complaints.map((c) => [c.complaintId, c.studentName, c.category, c.priority, c.status, c.location, c.createdAt]),
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=complaints-report.csv");
    res.send(rows.map((r) => r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(",")).join("\n"));
  })
);

/* ---------------- CAMPUS GRAPH / RESOURCES (stored records, starts empty) ---------------- */
router.get(
  "/campus/graph",
  auth,
  wrap(async (req, res) => {
    const graph = await graphRepo.buildGraph();
    ok(res, graph.toJSON());
  })
);

router.get(
  "/campus/resources",
  auth,
  wrap(async (req, res) => {
    ok(res, await graphRepo.getRecords());
  })
);

router.post(
  "/campus/graph/vertices",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    if (!req.body.name) return fail(res, 400, "name is required");
    await graphRepo.addVertex(String(req.body.name).trim());
    const graph = await graphRepo.buildGraph();
    ok(res, graph.toJSON(), "Vertex added");
  })
);

router.delete(
  "/campus/graph/vertices/:name",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    await graphRepo.removeVertex(req.params.name);
    const graph = await graphRepo.buildGraph();
    ok(res, graph.toJSON(), "Vertex removed");
  })
);

router.post(
  "/campus/graph/edges",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const { from, to, weight } = req.body || {};
    if (!from || !to) return fail(res, 400, "from and to are required");
    await graphRepo.addEdge(from, to, Number(weight) || 1);
    const graph = await graphRepo.buildGraph();
    ok(res, graph.toJSON(), "Edge added");
  })
);

router.delete(
  "/campus/graph/edges",
  auth,
  adminOnly,
  wrap(async (req, res) => {
    const { from, to } = req.body || {};
    if (!from || !to) return fail(res, 400, "from and to are required");
    await graphRepo.removeEdge(from, to);
    const graph = await graphRepo.buildGraph();
    ok(res, graph.toJSON(), "Edge removed");
  })
);

router.post(
  "/campus/graph/shortest-path",
  auth,
  wrap(async (req, res) => {
    const { from, to } = req.body || {};
    const graph = await graphRepo.buildGraph();
    const result = graph.dijkstra(from, to);
    ok(
      res,
      {
        path: result.path,
        distance: result.distance === Infinity ? null : result.distance,
        bfs: from ? graph.bfs(from) : [],
        dfs: from ? graph.dfs(from) : [],
      },
      "Shortest path computed with Dijkstra"
    );
  })
);

/* ---------------- DSA introspection (built from real records) ---------------- */
router.get(
  "/dsa/hash-table",
  auth,
  wrap(async (req, res) => {
    const hash = buildStudentHash(await studentsRepo.list());
    ok(res, { buckets: hash.display(), size: hash.size() });
  })
);

router.get(
  "/dsa/bst",
  auth,
  wrap(async (req, res) => {
    const bst = buildStudentBST(await studentsRepo.list());
    ok(res, {
      tree: bst.toTree(),
      inorder: bst.inorder(),
      preorder: bst.preorder(),
      postorder: bst.postorder(),
      min: bst.findMin(),
      max: bst.findMax(),
    });
  })
);

router.get(
  "/dsa/undo-stack",
  auth,
  wrap(async (req, res) => {
    ok(res, { items: undoStack.toArray(), size: undoStack.size(), peek: undoStack.peek() || null });
  })
);
