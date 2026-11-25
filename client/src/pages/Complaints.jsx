import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import { MessageSquareWarning, History } from "lucide-react";
import { api } from "../services/api.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useAuthStore, useUIStore } from "../store/index.js";

const CATEGORIES = ["Classroom", "Hostel", "Library", "Laboratory", "Transportation", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Submitted", "Pending", "Under Review", "Assigned", "Resolved", "Rejected"];

export function Complaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [form, setForm] = useState({ category: CATEGORIES[0], description: "", location: "", priority: "Medium" });
  const toast = useUIStore((s) => s.showToast);

  // Header search lands here with ?search= — keep the box in sync.
  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const load = () => {
    setLoading(true);
    api(`/complaints?search=${encodeURIComponent(query)}`)
      .then((d) => setItems(d.items))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [query]);

  const submit = async () => {
    if (!form.description.trim()) return toast("Please describe the problem first", "error");
    try {
      await api("/complaints", { method: "POST", body: JSON.stringify(form) });
      setForm({ ...form, description: "" });
      load();
      toast("Complaint submitted — it is now in the queue", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="card-title mb-3">Submit a Complaint</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Location (e.g. a campus location you added)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <button className="btn-primary" onClick={submit}>
            Submit
          </button>
        </div>
        <textarea
          className="input mt-2"
          rows={3}
          placeholder="Describe the problem…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="card">
        <input
          className="input max-w-sm mb-2"
          placeholder="Search complaints…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading ? (
          <div className="skeleton" />
        ) : items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.complaintId}>
                    <td>{c.complaintId}</td>
                    <td>{c.studentName}</td>
                    <td>{c.category}</td>
                    <td className="max-w-[240px] truncate">{c.description}</td>
                    <td>
                      <span className="badge">{c.priority}</span>
                    </td>
                    <td>{c.status}</td>
                    <td>
                      <Link className="text-primary font-semibold" to={`/complaints/${c.complaintId}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={MessageSquareWarning}
            title="No complaints yet"
            description="Complaints submitted from the form above will appear here."
          />
        )}
      </div>
    </div>
  );
}

export function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  const load = () => {
    api(`/complaints/${id}`)
      .then(setComplaint)
      .catch((e) => toast(e.message, "error"));
    api(`/complaints/${id}/history`)
      .then(setHistory)
      .catch(() => {});
  };
  useEffect(load, [id]);

  if (!complaint) return <div className="skeleton" />;

  const setStatus = async (status) => {
    try {
      const updated = await api(`/complaints/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setComplaint(updated);
      load();
      toast(`Complaint status updated to ${status}`, "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <div className="card">
        <h3 className="card-title">
          {complaint.complaintId} — {complaint.category}
        </h3>
        <p className="mt-2">{complaint.description}</p>
        <dl className="mt-4 space-y-1.5 text-muted">
          <div>
            Student:{" "}
            <b className="text-ink">
              {complaint.studentName} {complaint.studentId ? `(${complaint.studentId})` : ""}
            </b>
          </div>
          <div>
            Location: <b className="text-ink">{complaint.location || "—"}</b>
          </div>
          <div>
            Priority: <b className="text-ink">{complaint.priority}</b>
          </div>
          <div>
            Status: <b className="text-ink">{complaint.status}</b>
          </div>
          <div>
            Assigned: <b className="text-ink">{complaint.assignedTo || "—"}</b>
          </div>
        </dl>
        {user?.role === "admin" && (
          <div className="flex gap-2 flex-wrap mt-4">
            {STATUSES.map((s) => (
              <button key={s} className={s === complaint.status ? "btn-primary" : "btn-ghost"} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <button className="btn-ghost mt-4" onClick={() => navigate("/complaints")}>
          Back
        </button>
      </div>

      <div className="card">
        <h3 className="card-title mb-3">History (Singly Linked List, chronological)</h3>
        {history.map((entry, i) => (
          <div key={entry.id || i} className="border-l-[3px] border-lightorange pl-3 py-1.5 mb-2">
            <b>{entry.action}</b> — {entry.previousStatus || "—"} → {entry.newStatus}
            <br />
            <span className="text-muted text-[12px]">
              {new Date(entry.timestamp).toLocaleString()} · by {entry.adminId}
            </span>
          </div>
        ))}
        {!history.length && (
          <EmptyState
            icon={History}
            title="No history yet"
            description="Status changes on this complaint will be recorded here in order."
            minHeight={120}
          />
        )}
      </div>
    </div>
  );
}
