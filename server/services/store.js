import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isMongo } from "../config/db.js";
import {
  User,
  StudentModel,
  ComplaintModel,
  ComplaintHistoryModel,
  CampusLocationModel,
  CampusEdgeModel,
  ActivityLogModel,
  NotificationModel,
} from "../models/index.js";
import { Stack } from "../dsa/Stack.js";
import { Queue } from "../dsa/Queue.js";
import { PriorityQueue } from "../dsa/PriorityQueue.js";
import { LinkedList } from "../dsa/LinkedList.js";
import { HashTable } from "../dsa/HashTable.js";
import { BinarySearchTree } from "../dsa/BinarySearchTree.js";
import { Graph } from "../dsa/Graph.js";

/*
 * Data layer — fully dynamic, NO seeded/demo records.
 *
 * - MongoDB mode (MONGODB_URI connected): every read/write goes through the
 *   Mongoose models above.
 * - In-memory mode: collections live in a JSON file (server/data/db.json,
 *   gitignored) so a manual `npm run seed` (admin only) and records created
 *   through the API survive restarts. If the file does not exist the store
 *   starts COMPLETELY EMPTY — nothing is ever auto-created on server start.
 *
 * DSA structures are rebuilt on demand from the real records:
 * Queue (FIFO by createdAt), PriorityQueue (binary heap), LinkedList
 * (history), HashTable + BST (student indexes), Graph (stored vertices/edges).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const emptyDb = () => ({
  users: [],
  students: [],
  complaints: [],
  history: [],
  activity: [],
  notifications: [],
  graphVertices: [],
  graphEdges: [],
  counters: { user: 0, student: 0, complaint: 1000, event: 0, activity: 0, notification: 0 },
});

let mem = null;

export function loadMem() {
  if (mem) return mem;
  try {
    if (fs.existsSync(DATA_FILE)) {
      mem = { ...emptyDb(), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
      console.log(
        `[Store] In-memory store loaded from data/db.json (${mem.users.length} users, ` +
          `${mem.students.length} students, ${mem.complaints.length} complaints).`
      );
    }
  } catch (err) {
    console.error("[Store] Could not read data/db.json:", err.message);
  }
  if (!mem) {
    mem = emptyDb();
    console.log("[Store] In-memory store starts COMPLETELY EMPTY (no records, no seed data).");
  }
  return mem;
}

function saveMem() {
  if (isMongo()) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(mem, null, 2));
  } catch (err) {
    console.error("[Store] Could not persist data/db.json:", err.message);
  }
}

const nextMemId = (kind, prefix) => `${prefix}-${++mem.counters[kind]}`;
const nowISO = () => new Date().toISOString();

/* ---------------- normalizers (Mongo doc -> plain API object) ---------------- */
const plain = (doc) => (doc && typeof doc.toObject === "function" ? doc.toObject() : doc);
const normUser = (d) => {
  if (!d) return null;
  const o = plain(d);
  return {
    id: String(o._id || o.id),
    name: o.name,
    email: o.email,
    password: o.password,
    role: o.role,
    studentRef: o.studentRef || null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
};
const normStudent = (d) => {
  if (!d) return null;
  const o = plain(d);
  return {
    id: String(o._id || o.id),
    studentId: o.studentId,
    fullName: o.fullName,
    email: o.email,
    phone: o.phone || "",
    department: o.department || "",
    course: o.course || "",
    year: o.year || "",
    status: o.status || "Active",
    registrationDate: o.createdAt ? new Date(o.createdAt).toISOString() : o.registrationDate || null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : o.registrationDate || null,
  };
};
const normComplaint = (d) => {
  if (!d) return null;
  const o = plain(d);
  return {
    id: String(o._id || o.id),
    complaintId: o.complaintId,
    studentId: o.studentId ?? null,
    studentName: o.studentName || "",
    category: o.category,
    description: o.description || "",
    location: o.location || "",
    priority: o.priority || "Medium",
    status: o.status || "Submitted",
    assignedTo: o.assignedTo || "",
    adminNotes: o.adminNotes || "",
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
  };
};
const normHistory = (d) => {
  if (!d) return null;
  const o = plain(d);
  return {
    id: String(o._id || o.id),
    complaintId: o.complaintId,
    action: o.action,
    previousStatus: o.previousStatus || "",
    newStatus: o.newStatus || "",
    adminId: o.adminId || "",
    timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : o.timestamp,
  };
};
const normActivity = (d) => {
  if (!d) return null;
  const o = plain(d);
  return {
    id: String(o._id || o.id),
    action: o.action,
    actor: o.actor || "",
    detail: o.detail || "",
    timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : o.timestamp,
  };
};

/* ---------------- USERS ---------------- */
export const usersRepo = {
  async findByEmail(email) {
    const e = String(email || "").toLowerCase();
    if (isMongo()) return normUser(await User.findOne({ email: e }));
    loadMem();
    return mem.users.find((u) => u.email === e) || null;
  },
  async findById(id) {
    if (isMongo()) {
      const d = await User.findById(id).catch(() => null);
      return normUser(d);
    }
    loadMem();
    return mem.users.find((u) => u.id === id) || null;
  },
  async create(data) {
    if (isMongo()) return normUser(await User.create(data));
    loadMem();
    const u = { id: nextMemId("user", "U"), createdAt: nowISO(), ...data };
    mem.users.push(u);
    saveMem();
    return u;
  },
  async count() {
    if (isMongo()) return User.countDocuments();
    loadMem();
    return mem.users.length;
  },
};

/* ---------------- STUDENTS ---------------- */
export const studentsRepo = {
  async list() {
    if (isMongo()) return (await StudentModel.find().sort({ studentId: 1 })).map(normStudent);
    loadMem();
    return [...mem.students];
  },
  async findByStudentId(studentId) {
    if (isMongo()) return normStudent(await StudentModel.findOne({ studentId: Number(studentId) }));
    loadMem();
    return mem.students.find((s) => s.studentId === Number(studentId)) || null;
  },
  async findByKey(key) {
    if (isMongo()) {
      let d = await StudentModel.findOne({ studentId: Number(key) }).catch(() => null);
      if (!d && /^[a-f\d]{24}$/i.test(String(key))) d = await StudentModel.findById(key).catch(() => null);
      return normStudent(d);
    }
    loadMem();
    return mem.students.find((s) => s.id === key || s.studentId === Number(key)) || null;
  },
  async create(data) {
    if (isMongo()) return normStudent(await StudentModel.create(data));
    loadMem();
    const s = { id: nextMemId("student", "S"), status: "Active", registrationDate: nowISO(), createdAt: nowISO(), ...data };
    mem.students.push(s);
    saveMem();
    return s;
  },
  async update(key, patch) {
    if (isMongo()) {
      const current = await this.findByKey(key);
      if (!current) return null;
      const d = await StudentModel.findByIdAndUpdate(current.id, patch, { new: true });
      return normStudent(d);
    }
    loadMem();
    const s = mem.students.find((x) => x.id === key || x.studentId === Number(key));
    if (!s) return null;
    Object.assign(s, patch);
    saveMem();
    return s;
  },
  async remove(key) {
    if (isMongo()) {
      const current = await this.findByKey(key);
      if (!current) return null;
      await StudentModel.findByIdAndDelete(current.id);
      return current;
    }
    loadMem();
    const i = mem.students.findIndex((x) => x.id === key || x.studentId === Number(key));
    if (i < 0) return null;
    const [s] = mem.students.splice(i, 1);
    saveMem();
    return s;
  },
};

/* ---------------- COMPLAINTS ---------------- */
export const complaintsRepo = {
  async list() {
    if (isMongo()) return (await ComplaintModel.find().sort({ createdAt: 1 })).map(normComplaint);
    loadMem();
    return [...mem.complaints].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  },
  async findByKey(key) {
    if (isMongo()) {
      let d = await ComplaintModel.findOne({ complaintId: key });
      if (!d && /^[a-f\d]{24}$/i.test(String(key))) d = await ComplaintModel.findById(key).catch(() => null);
      return normComplaint(d);
    }
    loadMem();
    return mem.complaints.find((c) => c.complaintId === key || c.id === key) || null;
  },
  async nextComplaintId() {
    const all = await this.list();
    let max = 1000;
    all.forEach((c) => {
      const n = parseInt(String(c.complaintId || "").replace("CMP-", ""), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    });
    return `CMP-${max + 1}`;
  },
  async create(data) {
    if (isMongo()) return normComplaint(await ComplaintModel.create(data));
    loadMem();
    const c = { id: nextMemId("complaint", "C"), createdAt: nowISO(), updatedAt: nowISO(), ...data };
    // nextMemId for complaints is only used for the internal id; keep counter sane
    mem.complaints.push(c);
    saveMem();
    return c;
  },
  async update(key, patch) {
    if (isMongo()) {
      const current = await this.findByKey(key);
      if (!current) return null;
      const d = await ComplaintModel.findByIdAndUpdate(current.id, patch, { new: true });
      return normComplaint(d);
    }
    loadMem();
    const c = mem.complaints.find((x) => x.complaintId === key || x.id === key);
    if (!c) return null;
    Object.assign(c, patch, { updatedAt: nowISO() });
    saveMem();
    return c;
  },
  async remove(key) {
    if (isMongo()) {
      const current = await this.findByKey(key);
      if (!current) return null;
      await ComplaintModel.findByIdAndDelete(current.id);
      return current;
    }
    loadMem();
    const i = mem.complaints.findIndex((x) => x.complaintId === key || x.id === key);
    if (i < 0) return null;
    const [c] = mem.complaints.splice(i, 1);
    saveMem();
    return c;
  },
};

/* ---------------- HISTORY + ACTIVITY ---------------- */
export async function addHistory(complaintId, action, previousStatus, newStatus, actor = "system") {
  const entry = { complaintId, action, previousStatus: previousStatus || "", newStatus: newStatus || "", adminId: actor };
  const activity = { action, actor, detail: `${complaintId}: ${action}` };
  if (isMongo()) {
    const h = normHistory(await ComplaintHistoryModel.create(entry));
    await ActivityLogModel.create(activity);
    return h;
  }
  loadMem();
  const h = { id: nextMemId("event", "EVT"), timestamp: nowISO(), ...entry };
  mem.history.push(h);
  mem.activity.unshift({ id: nextMemId("activity", "ACT"), timestamp: h.timestamp, ...activity });
  saveMem();
  return h;
}

export async function historyForComplaint(complaintId) {
  let rows;
  if (isMongo()) {
    rows = (await ComplaintHistoryModel.find({ complaintId }).sort({ createdAt: 1 })).map(normHistory);
  } else {
    loadMem();
    rows = mem.history
      .filter((h) => h.complaintId === complaintId)
      .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  }
  // Singly Linked List built from the real history records, traversed in order.
  const list = new LinkedList();
  rows.forEach((r) => list.insertAtEnd(r));
  return list.traverse();
}

export async function listActivity(limit = 100) {
  let rows;
  if (isMongo()) {
    rows = (await ActivityLogModel.find().sort({ createdAt: -1 }).limit(limit)).map(normActivity);
  } else {
    loadMem();
    rows = mem.activity.slice(0, limit);
  }
  const list = new LinkedList();
  rows.forEach((r) => list.insertAtEnd(r));
  return { items: rows, linkedList: list.traverse() };
}

export async function listNotifications(userId) {
  if (isMongo()) {
    const q = userId ? { $or: [{ userId }, { userId: null }] } : {};
    return (await NotificationModel.find(q).sort({ createdAt: -1 })).map((d) => {
      const o = plain(d);
      return { id: String(o._id), message: o.message, read: o.read, createdAt: new Date(o.createdAt).toISOString() };
    });
  }
  loadMem();
  return mem.notifications.filter((n) => !userId || n.userId === userId || !n.userId);
}

/* ---------------- DSA views built from real records ---------------- */
export const PENDING_STATUSES = ["Submitted", "Pending", "Under Review", "Assigned"];

export function buildQueue(complaints) {
  const queue = new Queue();
  complaints
    .filter((c) => PENDING_STATUSES.includes(c.status))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .forEach((c) => queue.enqueue(c));
  return queue;
}

export function buildPriorityQueue(complaints) {
  const pq = new PriorityQueue();
  complaints
    .filter((c) => PENDING_STATUSES.includes(c.status))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .forEach((c) => pq.insert(c));
  return pq;
}

export function buildStudentHash(students) {
  const hash = new HashTable(53);
  students.forEach((s) => hash.set(s.studentId, s));
  return hash;
}

export function buildStudentBST(students) {
  const bst = new BinarySearchTree();
  students.forEach((s) => bst.insert(s.studentId, s));
  return bst;
}

/* Undo stack — server-side, holds previous states of real admin actions. */
export const undoStack = new Stack();

/* ---------------- CAMPUS GRAPH (stored records, starts empty) ---------------- */
export const graphRepo = {
  async getRecords() {
    if (isMongo()) {
      const vertices = (await CampusLocationModel.find().sort({ name: 1 })).map((d) => d.name);
      const edges = (await CampusEdgeModel.find()).map((d) => {
        const o = plain(d);
        return { from: o.from, to: o.to, weight: o.weight };
      });
      return { vertices, edges };
    }
    loadMem();
    return { vertices: [...mem.graphVertices], edges: [...mem.graphEdges] };
  },
  async buildGraph() {
    const { vertices, edges } = await this.getRecords();
    const graph = new Graph();
    vertices.forEach((v) => graph.addVertex(v));
    edges.forEach((e) => graph.addEdge(e.from, e.to, e.weight));
    return graph;
  },
  async addVertex(name) {
    if (isMongo()) {
      await CampusLocationModel.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
      return;
    }
    loadMem();
    if (!mem.graphVertices.includes(name)) mem.graphVertices.push(name);
    saveMem();
  },
  async addEdge(from, to, weight) {
    await this.addVertex(from);
    await this.addVertex(to);
    if (isMongo()) {
      await CampusEdgeModel.updateOne({ from, to }, { $set: { weight } }, { upsert: true });
      await CampusEdgeModel.updateOne({ from: to, to: from }, { $set: { weight } }, { upsert: true });
      return;
    }
    loadMem();
    const existing = mem.graphEdges.find(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    if (existing) existing.weight = weight;
    else mem.graphEdges.push({ from, to, weight });
    saveMem();
  },
  async removeVertex(name) {
    if (isMongo()) {
      await CampusLocationModel.deleteOne({ name });
      await CampusEdgeModel.deleteMany({ $or: [{ from: name }, { to: name }] });
      return;
    }
    loadMem();
    mem.graphVertices = mem.graphVertices.filter((v) => v !== name);
    mem.graphEdges = mem.graphEdges.filter((e) => e.from !== name && e.to !== name);
    saveMem();
  },
  async removeEdge(from, to) {
    if (isMongo()) {
      await CampusEdgeModel.deleteMany({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      });
      return;
    }
    loadMem();
    mem.graphEdges = mem.graphEdges.filter(
      (e) => !((e.from === from && e.to === to) || (e.from === to && e.to === from))
    );
    saveMem();
  },
};
