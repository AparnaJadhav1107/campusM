import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Users } from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";
import { api } from "../services/api.js";
import { useAuthStore, useUIStore } from "../store/index.js";

const EMPTY_FORM = {
  studentId: "",
  fullName: "",
  email: "",
  phone: "",
  department: "",
  course: "",
  year: "",
};
const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"];
const LABELS = {
  studentId: "Student ID (number)",
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  department: "Department",
  course: "Course",
  year: "Year",
};

export default function Students() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [dept, setDept] = useState("");
  const [sort, setSort] = useState("studentId");
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.showToast);

  // Header search lands here with ?search= — keep the box in sync.
  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const load = () => {
    setLoading(true);
    api(`/students?search=${encodeURIComponent(query)}&department=${encodeURIComponent(dept)}&sort=${sort}`)
      .then((d) => setItems(d.items))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [query, dept, sort]);

  const save = async () => {
    if (!form.studentId || !form.fullName.trim() || !form.email.trim())
      return toast("Student ID, full name and email are required", "error");
    try {
      await api("/students", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
      toast("Student added successfully", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this student?")) return;
    try {
      await api(`/students/${id}`, { method: "DELETE" });
      toast("Student deleted", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="card">
      <div className="flex gap-2 flex-wrap mb-3 items-center">
        <input
          className="input !w-auto flex-1 min-w-[180px] max-w-xs"
          placeholder="Search name, email, or Student ID (hash lookup)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input !w-auto max-w-[190px]" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select className="input !w-auto max-w-[150px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="studentId">Sort: ID</option>
          <option value="fullName">Sort: Name</option>
          <option value="department">Sort: Dept</option>
        </select>
        {user?.role === "admin" && (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="btn-primary ml-auto">+ Add Student</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" data-radix-dialog-overlay />
              <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 card w-[min(440px,92vw)] pop-in max-h-[88dvh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <Dialog.Title className="card-title">Add Student</Dialog.Title>
                  <Dialog.Close className="text-muted hover:text-ink">
                    <X size={16} />
                  </Dialog.Close>
                </div>
                {Object.keys(EMPTY_FORM).map((key) => (
                  <input
                    key={key}
                    className="input mb-2"
                    placeholder={LABELS[key]}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ))}
                <button className="btn-primary w-full" onClick={save}>
                  Save Student
                </button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>

      {loading ? (
        <div className="skeleton" />
      ) : items.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Course</th>
                <th>Year</th>
                <th>Status</th>
                {user?.role === "admin" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.studentId}</td>
                  <td>
                    <b>{s.fullName}</b>
                  </td>
                  <td>{s.email}</td>
                  <td>{s.phone || "—"}</td>
                  <td>{s.department || "—"}</td>
                  <td>{s.course || "—"}</td>
                  <td>{s.year || "—"}</td>
                  <td>
                    <span className="badge">{s.status}</span>
                  </td>
                  {user?.role === "admin" && (
                    <td>
                      <button className="text-danger font-semibold" onClick={() => remove(s.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students yet"
          description={
            user?.role === "admin"
              ? "Add the first student and it will appear here, indexed for instant hash lookup."
              : "Students added by the admin will appear here."
          }
          actionLabel={user?.role === "admin" ? "Add Student" : undefined}
          onAction={user?.role === "admin" ? () => setOpen(true) : undefined}
        />
      )}
    </div>
  );
}
