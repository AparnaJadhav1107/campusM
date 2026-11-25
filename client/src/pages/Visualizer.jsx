import { useMemo, useState } from "react";
import Stack from "../dsa/Stack.js";
import Queue from "../dsa/Queue.js";
import PriorityQueue from "../dsa/PriorityQueue.js";
import LinkedList from "../dsa/LinkedList.js";
import HashTable from "../dsa/HashTable.js";
import BinarySearchTree from "../dsa/BinarySearchTree.js";
import Graph from "../dsa/Graph.js";
import { useUIStore } from "../store/index.js";

// Validation feedback in the visualizers is a toast, not a log line.
const toastError = (m) => useUIStore.getState().showToast(m, "error");

/*
 * Every visualizer starts COMPLETELY EMPTY.
 * Nothing is preloaded — the structures below are built only by your operations.
 */
const INFO = {
  Array: { use: "Storing an ordered list of items you add (e.g. timetable slots).", time: "Access O(1), Insert/Delete O(n)", space: "O(n)" },
  Stack: { use: "Undo for admin actions — last action is reversed first (LIFO).", time: "Push/Pop/Peek O(1)", space: "O(n)" },
  Queue: { use: "FIFO complaint processing — first submitted, first processed.", time: "Enqueue/Dequeue O(1)", space: "O(n)" },
  PriorityQueue: { use: "Critical complaints jump ahead via a binary heap.", time: "Insert/Extract O(log n), Peek O(1)", space: "O(n)" },
  LinkedList: { use: "Complaint history — events appended in chronological order.", time: "Insert head O(1), end/search/delete O(n)", space: "O(n)" },
  HashTable: { use: "Instant student lookup by Student ID (separate chaining).", time: "Average O(1), worst O(n)", space: "O(n)" },
  BST: { use: "Student records ordered by numeric Student ID.", time: "Average O(log n), worst O(n)", space: "O(n)" },
  Graph: { use: "Campus locations + paths you add; Dijkstra gives the shortest route.", time: "BFS/DFS O(V+E), Dijkstra O((V+E) log V)", space: "O(V+E)" },
};

function Section({ name, children, log }) {
  const info = INFO[name];
  return (
    <div className="card card-hover">
      <h3 className="card-title">{name} Visualizer</h3>
      <p className="text-muted text-[12px] mt-0.5">{info.use}</p>
      <p className="text-[11px] mt-1">
        <b>Time:</b> {info.time} · <b>Space:</b> {info.space}
      </p>
      <div className="mt-3">{children}</div>
      {log?.length > 0 && (
        <div className="bg-[#faf8f5] border border-line rounded-lg p-2.5 mt-3 text-[11px] font-mono max-h-32 overflow-auto">
          {log.map((line, i) => (
            <div key={i}>› {line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function useLog() {
  const [log, setLog] = useState([]);
  return [log, (m) => setLog((l) => [m, ...l].slice(0, 20)), () => setLog([])];
}

const chip = "bg-peach text-[#7a4a00] px-2.5 py-1.5 rounded-md text-[12px] font-medium pop-in";
const inputCls = "input !w-auto flex-1 min-w-[110px] max-w-[170px]";

function ArrayViz() {
  const [items, setItems] = useState([]);
  const [value, setValue] = useState("");
  const [log, push, clearLog] = useLog();
  return (
    <Section name="Array" log={log}>
      <div className="flex gap-1.5 flex-wrap mb-3 min-h-[30px]">
        {items.map((x, i) => (
          <span key={i} className={chip}>
            [{i}] {x}
          </span>
        ))}
        {!items.length && <p className="text-muted">Empty array — insert a value to begin.</p>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!value.trim()) return toastError("Type a value first");
            setItems([...items, value.trim()]);
            push(`insert at end: ${value.trim()}`);
          }}
        >
          Insert
        </button>
        <button className="btn-ghost" onClick={() => push(`search "${value}" → index ${items.indexOf(value)}`)}>
          Search
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            setItems(items.slice(0, -1));
            push("delete last");
          }}
        >
          Delete Last
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            setItems([]);
            clearLog();
          }}
        >
          Reset
        </button>
      </div>
    </Section>
  );
}

function StackViz() {
  const stack = useMemo(() => new Stack(), []);
  const [, force] = useState(0);
  const [value, setValue] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  return (
    <Section name="Stack" log={log}>
      <div className="flex flex-col-reverse gap-1 w-44 mb-3">
        {stack.toArray().map((x, i) => (
          <div
            key={i}
            className={
              "p-1.5 rounded-md text-center text-[12px] pop-in " +
              (i === stack.size() - 1 ? "bg-primary text-white font-semibold" : "bg-peach")
            }
          >
            {x}
            {i === stack.size() - 1 ? " ← top" : ""}
          </div>
        ))}
        {stack.isEmpty() && <p className="text-muted">Empty stack</p>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Action" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!value.trim()) return toastError("Type a value first");
            stack.push(value.trim());
            push(`push(${value.trim()})`);
            rerender();
          }}
        >
          Push
        </button>
        <button className="btn-ghost" onClick={() => { push(`pop() → ${stack.pop()}`); rerender(); }}>
          Pop
        </button>
        <button className="btn-ghost" onClick={() => push(`peek() → ${stack.peek()}`)}>
          Peek
        </button>
        <button className="btn-ghost" onClick={() => { stack.clear(); clearLog(); rerender(); }}>
          Reset
        </button>
      </div>
    </Section>
  );
}

function QueueViz() {
  const queue = useMemo(() => new Queue(), []);
  const [, force] = useState(0);
  const [value, setValue] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  return (
    <Section name="Queue" log={log}>
      <div className="flex gap-1.5 flex-wrap mb-3 items-center min-h-[30px]">
        {queue.toArray().map((x, i) => (
          <span key={i} className={i === 0 ? "bg-primary text-white px-2.5 py-1.5 rounded-md text-[12px] font-semibold pop-in" : chip}>
            {i === 0 ? "FRONT · " : ""}
            {x}
          </span>
        ))}
        {queue.isEmpty() && <p className="text-muted">Empty queue</p>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Complaint ID" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!value.trim()) return toastError("Type a value first");
            queue.enqueue(value.trim());
            push(`enqueue(${value.trim()})`);
            rerender();
          }}
        >
          Enqueue
        </button>
        <button className="btn-ghost" onClick={() => { push(`dequeue() → ${queue.dequeue()}`); rerender(); }}>
          Dequeue
        </button>
        <button className="btn-ghost" onClick={() => push(`peek() → ${queue.peek()}`)}>
          Peek
        </button>
        <button className="btn-ghost" onClick={() => { queue.clear(); clearLog(); rerender(); }}>
          Reset
        </button>
      </div>
    </Section>
  );
}

function PriorityQueueViz() {
  const pq = useMemo(() => new PriorityQueue(), []);
  const [, force] = useState(0);
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState("High");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  return (
    <Section name="PriorityQueue" log={log}>
      <div className="space-y-1 mb-3">
        {pq.toArray().map((x, i) => (
          <div key={i} className="bg-peach rounded-md px-2.5 py-1.5 text-[12px] pop-in">
            {i + 1}. {x.label} — <b>{x.priority}</b>
          </div>
        ))}
        {pq.isEmpty() && <p className="text-muted">Empty heap</p>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
        <select className="input !w-auto max-w-[130px]" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {["Low", "Medium", "High", "Critical"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={() => {
            if (!label.trim()) return toastError("Type a label first");
            pq.insert({ label: label.trim(), priority });
            push(`insert(${label.trim()}, ${priority}) — heapified`);
            rerender();
          }}
        >
          Insert
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            const x = pq.extractMax();
            push(`extractMax() → ${x ? `${x.label} (${x.priority})` : "empty"}`);
            rerender();
          }}
        >
          Extract Max
        </button>
        <button className="btn-ghost" onClick={() => push(`peek() → ${pq.peek() ? `${pq.peek().label} (${pq.peek().priority})` : "empty"}`)}>
          Peek
        </button>
        <button className="btn-ghost" onClick={() => { pq.clear(); clearLog(); rerender(); }}>
          Reset
        </button>
      </div>
    </Section>
  );
}

function LinkedListViz() {
  const list = useMemo(() => new LinkedList(), []);
  const [, force] = useState(0);
  const [value, setValue] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  return (
    <Section name="LinkedList" log={log}>
      <div className="flex gap-1.5 flex-wrap mb-3 items-center min-h-[30px]">
        {list.traverse().map((x, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={chip}>{x}</span>
            <span className="text-muted">→</span>
          </span>
        ))}
        <span className="text-muted">null</span>
        {!list.traverse().length && <span className="text-muted ml-2">(empty list)</span>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Event" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!value.trim()) return toastError("Type a value first");
            list.insertAtEnd(value.trim());
            push(`insertAtEnd(${value.trim()})`);
            rerender();
          }}
        >
          Insert End
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            if (!value.trim()) return toastError("Type a value first");
            list.insertAtBeginning(value.trim());
            push(`insertAtBeginning(${value.trim()})`);
            rerender();
          }}
        >
          Insert Head
        </button>
        <button className="btn-ghost" onClick={() => { list.delete(value); push(`delete(${value})`); rerender(); }}>
          Delete
        </button>
        <button className="btn-ghost" onClick={() => push(`search(${value}) → index ${list.search(value)}`)}>
          Search
        </button>
        <button className="btn-ghost" onClick={() => { list.clear(); clearLog(); rerender(); }}>
          Reset
        </button>
      </div>
    </Section>
  );
}

function HashTableViz() {
  const table = useMemo(() => new HashTable(7), []);
  const [, force] = useState(0);
  const [key, setKey] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  return (
    <Section name="HashTable" log={log}>
      <div className="grid sm:grid-cols-2 gap-1 mb-3 text-[11px]">
        {table.display().map((b) => (
          <div key={b.bucket} className="bg-[#faf8f5] border border-line rounded-md p-2">
            Bucket {b.bucket}: {b.entries.map((e) => `${e.key}→${e.value}`).join(" , ") || "—"}
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="Student ID" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!key.trim()) return toastError("Type a student ID first");
            table.set(key.trim(), "Student " + key.trim());
            push(`insert(${key.trim()}) → bucket ${table.hash(key.trim())} (separate chaining on collision)`);
            rerender();
          }}
        >
          Insert
        </button>
        <button className="btn-ghost" onClick={() => push(`search(${key}) → ${table.get(key) || "not found"}`)}>
          Search
        </button>
        <button className="btn-ghost" onClick={() => { table.delete(key); push(`delete(${key})`); rerender(); }}>
          Delete
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            table.display().forEach((b) => b.entries.forEach((e) => table.delete(e.key)));
            clearLog();
            rerender();
          }}
        >
          Reset
        </button>
      </div>
    </Section>
  );
}

function BSTViz() {
  const bst = useMemo(() => new BinarySearchTree(), []);
  const [, force] = useState(0);
  const [value, setValue] = useState("");
  const [out, setOut] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  const renderNode = (node, depth = 0) =>
    node ? (
      <div key={node.key} style={{ marginLeft: depth * 18 }} className="py-[2px]">
        <span className={chip}>{node.key}</span>
        {renderNode(node.left, depth + 1)}
        {renderNode(node.right, depth + 1)}
      </div>
    ) : null;
  const tree = bst.toTree();
  return (
    <Section name="BST" log={log}>
      <div className="mb-3">{tree ? renderNode(tree) : <p className="text-muted">Empty tree — insert numeric student IDs.</p>}</div>
      {out && <p className="bg-[#faf8f5] border border-line rounded-md p-2 mb-2 text-[12px]">{out}</p>}
      <div className="flex gap-2 flex-wrap">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Numeric ID" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!value.trim() || Number.isNaN(Number(value))) return toastError("Type a numeric ID first");
            bst.insert(Number(value));
            push(`insert(${value})`);
            rerender();
          }}
        >
          Insert
        </button>
        <button className="btn-ghost" onClick={() => push(`search(${value}) → ${bst.search(Number(value)) ?? "not found"}`)}>
          Search
        </button>
        <button className="btn-ghost" onClick={() => { bst.delete(Number(value)); push(`delete(${value})`); rerender(); }}>
          Delete
        </button>
        <button className="btn-ghost" onClick={() => setOut("Inorder: " + bst.inorder().join(", "))}>
          Inorder
        </button>
        <button className="btn-ghost" onClick={() => setOut("Preorder: " + bst.preorder().join(", "))}>
          Preorder
        </button>
        <button className="btn-ghost" onClick={() => setOut("Postorder: " + bst.postorder().join(", "))}>
          Postorder
        </button>
        <button className="btn-ghost" onClick={() => setOut(`Min: ${bst.findMin()} · Max: ${bst.findMax()}`)}>
          Min/Max
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            bst.inorder().slice().forEach((v) => bst.delete(typeof v === "object" ? v.studentId : v));
            // inorder returns keys when values default to keys in this visualizer
            setOut("");
            clearLog();
            rerender();
          }}
        >
          Reset
        </button>
      </div>
    </Section>
  );
}

function GraphViz() {
  const [graph] = useState(() => new Graph()); // starts EMPTY — you add vertices and edges
  const [, force] = useState(0);
  const [vertex, setVertex] = useState("");
  const [edge, setEdge] = useState({ from: "", to: "", weight: "" });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [out, setOut] = useState("");
  const [log, push, clearLog] = useLog();
  const rerender = () => force((x) => x + 1);
  const vertices = graph.vertices();

  return (
    <Section name="Graph" log={log}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {vertices.map((v) => (
          <span key={v} className={chip}>
            {v}
          </span>
        ))}
        {!vertices.length && <p className="text-muted">Empty graph — add your first location below.</p>}
      </div>
      <div className="space-y-1 mb-3 text-[12px]">
        {graph.edges().map((e, i) => (
          <div key={i}>
            {e.from} ↔ {e.to} — {e.weight} m
          </div>
        ))}
      </div>
      {out && <p className="bg-[#faf8f5] border border-line rounded-md p-2 mb-2 text-[12px]">{out}</p>}

      <div className="flex gap-2 flex-wrap mb-2">
        <input className={inputCls} value={vertex} onChange={(e) => setVertex(e.target.value)} placeholder="Location name" />
        <button
          className="btn-primary"
          onClick={() => {
            if (!vertex.trim()) return toastError("Type a location name first");
            graph.addVertex(vertex.trim());
            push(`addVertex(${vertex.trim()})`);
            setVertex("");
            rerender();
          }}
        >
          Add Vertex
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-2">
        <select className="input !w-auto max-w-[140px]" value={edge.from} onChange={(e) => setEdge({ ...edge, from: e.target.value })}>
          <option value="">From…</option>
          {vertices.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select className="input !w-auto max-w-[140px]" value={edge.to} onChange={(e) => setEdge({ ...edge, to: e.target.value })}>
          <option value="">To…</option>
          {vertices.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <input className="input !w-[84px]" value={edge.weight} onChange={(e) => setEdge({ ...edge, weight: e.target.value })} placeholder="Metres" />
        <button
          className="btn-ghost"
          onClick={() => {
            if (!edge.from || !edge.to) return toastError("Pick both endpoints first");
            graph.addEdge(edge.from, edge.to, Number(edge.weight) || 1);
            push(`addEdge(${edge.from}, ${edge.to}, ${Number(edge.weight) || 1})`);
            rerender();
          }}
        >
          Add Edge
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <select className="input !w-auto max-w-[140px]" value={start} onChange={(e) => setStart(e.target.value)}>
          <option value="">Start…</option>
          {vertices.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select className="input !w-auto max-w-[140px]" value={end} onChange={(e) => setEnd(e.target.value)}>
          <option value="">End…</option>
          {vertices.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button
          className="btn-ghost"
          onClick={() => {
            if (!start) return toastError("Pick a start vertex first");
            setOut("BFS: " + graph.bfs(start).join(" → "));
            push(`BFS from ${start}`);
          }}
        >
          BFS
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            if (!start) return toastError("Pick a start vertex first");
            setOut("DFS: " + graph.dfs(start).join(" → "));
            push(`DFS from ${start}`);
          }}
        >
          DFS
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            if (!start || !end) return toastError("Pick start and end vertices first");
            const r = graph.dijkstra(start, end);
            setOut(`Dijkstra ${start}→${end}: ${r.path.join(" → ") || "no path"} (${r.distance} m)`);
            push("Dijkstra computed");
          }}
        >
          Dijkstra
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            vertices.slice().forEach((v) => graph.removeVertex(v));
            setOut("");
            clearLog();
            rerender();
          }}
        >
          Reset
        </button>
      </div>
    </Section>
  );
}

export default function Visualizer() {
  return (
    <div className="space-y-4">
      <p className="text-muted">
        Every structure below starts <b className="text-ink">empty</b> — build each visualization with your own operations.
      </p>
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <ArrayViz />
        <StackViz />
        <QueueViz />
        <PriorityQueueViz />
        <LinkedListViz />
        <HashTableViz />
        <BSTViz />
        <GraphViz />
      </div>
    </div>
  );
}
