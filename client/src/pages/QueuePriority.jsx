import { useEffect, useState } from "react";
import { ListOrdered, Flame, MapPin, Route, History } from "lucide-react";
import { api } from "../services/api.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useAuthStore, useUIStore } from "../store/index.js";

export function QueuePage() {
  const [data, setData] = useState(null);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);
  const load = () => api("/queue").then(setData).catch((e) => toast(e.message, "error"));
  useEffect(load, []);
  if (!data) return <div className="skeleton" />;

  return (
    <div className="card">
      <p className="text-muted mb-3">
        <b className="text-ink">Queue (FIFO)</b> built from your real pending complaints, oldest first. Size:{" "}
        <b className="text-ink">{data.size}</b> · Front: <b className="text-ink">{data.peek?.complaintId || "empty"}</b>
      </p>
      <div className="flex gap-2 flex-wrap items-center mb-4">
        {data.items.map((c, i) => (
          <span key={c.complaintId} className="flex items-center gap-2">
            <span
              className={
                "px-2.5 py-1.5 rounded-lg text-[12px] font-semibold pop-in " +
                (i === 0 ? "bg-primary text-white" : "bg-peach text-[#9a6200]")
              }
            >
              #{c.position} {c.complaintId}
              <br />
              <small className="font-medium opacity-80">
                {c.studentName} · {c.category}
              </small>
            </span>
            {i < data.items.length - 1 && <span className="text-primary">→</span>}
          </span>
        ))}
      </div>
      {!data.items.length && (
        <EmptyState
          icon={ListOrdered}
          title="Queue is empty"
          description="Pending complaints are enqueued here automatically in FIFO order."
          actionLabel="Submit a complaint"
          to="/complaints"
        />
      )}
      {user?.role === "admin" && data.items.length > 0 && (
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              const c = await api("/queue/dequeue", { method: "POST", body: "{}" });
              toast(`Dequeued ${c.complaintId} (FIFO) — now Under Review`, "success");
              load();
            } catch (e) {
              toast(e.message, "error");
            }
          }}
        >
          Dequeue Front (start processing)
        </button>
      )}
    </div>
  );
}

export function PriorityPage() {
  const [data, setData] = useState(null);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);
  const load = () => api("/priority-queue").then(setData).catch((e) => toast(e.message, "error"));
  useEffect(load, []);
  if (!data) return <div className="skeleton" />;

  return (
    <div className="card">
      <p className="text-muted mb-3">
        <b className="text-ink">Priority Queue (Binary Heap)</b> built from your real pending complaints — Critical &gt;
        High &gt; Medium &gt; Low, FIFO tie-break. Size: <b className="text-ink">{data.size}</b>
      </p>
      <div className="space-y-1.5 mb-4">
        {data.items.map((c, i) => (
          <div
            key={c.complaintId + i}
            className="flex items-center justify-between gap-3 bg-[#faf8f5] border border-line rounded-lg px-3 py-2 pop-in"
          >
            <span className="min-w-0 truncate">
              <b>
                {i + 1}. {c.complaintId}
              </b>{" "}
              — {c.description}
            </span>
            <span className="badge shrink-0">{c.priority}</span>
          </div>
        ))}
      </div>
      {!data.items.length && (
        <EmptyState
          icon={Flame}
          title="No pending complaints"
          description="Pending complaints are inserted into the priority heap automatically."
          actionLabel="Submit a complaint"
          to="/complaints"
        />
      )}
      {user?.role === "admin" && data.items.length > 0 && (
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              const c = await api("/priority-queue/extract", { method: "POST", body: "{}" });
              toast(`Extracted highest priority: ${c.complaintId} — now Assigned`, "success");
              load();
            } catch (e) {
              toast(e.message, "error");
            }
          }}
        >
          Extract Max (assign it)
        </button>
      )}
    </div>
  );
}

export function Resources() {
  const [graph, setGraph] = useState(null);
  const [vertexName, setVertexName] = useState("");
  const [edge, setEdge] = useState({ from: "", to: "", weight: "" });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState(null);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);
  const isAdmin = user?.role === "admin";

  const load = () =>
    api("/campus/graph")
      .then((g) => {
        setGraph(g);
        setFrom((prev) => prev || g.vertices[0] || "");
        setTo((prev) => prev || g.vertices[1] || g.vertices[0] || "");
      })
      .catch((e) => toast(e.message, "error"));
  useEffect(load, []);
  if (!graph) return <div className="skeleton" />;

  const addVertex = async () => {
    if (!vertexName.trim()) return toast("Please enter a location name", "error");
    try {
      setGraph(await api("/campus/graph/vertices", { method: "POST", body: JSON.stringify({ name: vertexName.trim() }) }));
      setVertexName("");
      toast("Location added to the campus graph", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const addEdge = async () => {
    try {
      setGraph(
        await api("/campus/graph/edges", {
          method: "POST",
          body: JSON.stringify({ from: edge.from, to: edge.to, weight: Number(edge.weight) || 1 }),
        })
      );
      toast("Connection added", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const findPath = async () => {
    try {
      setResult(await api("/campus/graph/shortest-path", { method: "POST", body: JSON.stringify({ from, to }) }));
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const empty = graph.vertices.length === 0;

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="card-title mb-1">Campus Graph (undirected, weighted)</h3>
        <p className="text-muted text-[12px] mb-3">
          Locations and connections are records you create — the graph starts empty and stores everything you add.
        </p>
        {empty ? (
          <EmptyState
            icon={MapPin}
            title="No campus locations yet"
            description={
              isAdmin
                ? "Add your first location below and the campus graph will start taking shape."
                : "The admin has not added any campus locations yet."
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {graph.vertices.map((v) => (
                <span key={v} className="badge !py-1.5 !px-2.5 !text-[12px]">
                  {v}
                </span>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
              {graph.edges.map((e, i) => (
                <div key={i} className="bg-[#faf8f5] border border-line rounded-lg px-3 py-2">
                  {e.from} ↔ {e.to} — <b>{e.weight} m</b>
                </div>
              ))}
            </div>
            {!graph.edges.length && <p className="text-muted mt-3">No connections yet — add an edge between two locations.</p>}
          </>
        )}

        {isAdmin && (
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="New location name"
                value={vertexName}
                onChange={(e) => setVertexName(e.target.value)}
              />
              <button className="btn-primary shrink-0" onClick={addVertex}>
                Add Location
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select className="input !w-auto flex-1 min-w-[110px]" value={edge.from} onChange={(e) => setEdge({ ...edge, from: e.target.value })}>
                <option value="">From…</option>
                {graph.vertices.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select className="input !w-auto flex-1 min-w-[110px]" value={edge.to} onChange={(e) => setEdge({ ...edge, to: e.target.value })}>
                <option value="">To…</option>
                {graph.vertices.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <input
                className="input !w-[90px]"
                placeholder="Metres"
                value={edge.weight}
                onChange={(e) => setEdge({ ...edge, weight: e.target.value })}
              />
              <button className="btn-primary shrink-0" onClick={addEdge} disabled={graph.vertices.length < 2}>
                Add Edge
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title mb-3">Shortest Path — Dijkstra</h3>
        {graph.vertices.length >= 2 ? (
          <>
            <div className="flex gap-2 flex-wrap">
              <select className="input !w-auto flex-1 min-w-[130px] max-w-[220px]" value={from} onChange={(e) => setFrom(e.target.value)}>
                {graph.vertices.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select className="input !w-auto flex-1 min-w-[130px] max-w-[220px]" value={to} onChange={(e) => setTo(e.target.value)}>
                {graph.vertices.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={findPath}>
                Find Path
              </button>
            </div>
            {result && (
              <div className="mt-3">
                <p>
                  <b>Path:</b> {result.path?.length ? result.path.join(" → ") : "No path"} · <b>Distance:</b>{" "}
                  {result.distance ?? "—"} m
                </p>
                <p className="text-muted mt-1 text-[12px]">
                  BFS from {from}: {result.bfs.join(", ") || "—"}
                  <br />
                  DFS from {from}: {result.dfs.join(", ") || "—"}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Route}
            title="Not enough locations"
            description="Add at least two locations and an edge between them to compute shortest paths."
            minHeight={120}
          />
        )}
      </div>
    </div>
  );
}

export function Activity() {
  const [data, setData] = useState(null);
  const toast = useUIStore((s) => s.showToast);
  useEffect(() => {
    api("/activity")
      .then(setData)
      .catch((e) => {
        toast(e.message, "error");
        setData({ items: [] });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!data) return <div className="skeleton" />;

  return (
    <div className="card">
      <h3 className="card-title mb-3">Activity History</h3>
      {(data.items || []).map((a) => (
        <div key={a.id} className="border-l-[3px] border-lightorange pl-3 py-1.5 mb-2">
          <b>{a.action}</b> — {a.detail}
          <br />
          <span className="text-muted text-[12px]">
            {new Date(a.timestamp).toLocaleString()} · {a.actor}
          </span>
        </div>
      ))}
      {!data.items?.length && (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Actions on complaints and students will be recorded here in order."
        />
      )}
    </div>
  );
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);
  const undo = async () => {
    try {
      const c = await api("/undo", { method: "POST", body: "{}" });
      toast(`Undid last action on ${c.complaintId} — status is now ${c.status}`, "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="card max-w-lg">
      <h3 className="card-title mb-3">Profile & Settings</h3>
      <p>
        Name: <b>{user?.name}</b>
        <br />
        Email: <b>{user?.email}</b>
        <br />
        Role: <b className="capitalize">{user?.role}</b>
      </p>
      {user?.role === "admin" && (
        <div className="mt-5 border-t border-line pt-4">
          <h4 className="font-semibold mb-1">Undo (Stack — LIFO)</h4>
          <p className="text-muted text-[12px] mb-3">
            Reverses the most recent supported admin action (complaint status change / assignment). Not every operation is
            undoable.
          </p>
          <button className="btn-primary" onClick={undo}>
            Undo Last Admin Action
          </button>
        </div>
      )}
    </div>
  );
}
