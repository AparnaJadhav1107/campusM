import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MessageSquareWarning, Clock, CheckCircle2, Inbox } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { api } from "../services/api.js";
import { useUIStore } from "../store/index.js";
import EmptyState from "../components/ui/EmptyState.jsx";

const COLORS = ["#FF8900", "#FFAA45", "#FFC078", "#C97B12", "#16A36A", "#EF4444"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState(30);
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.showToast);

  useEffect(() => {
    api("/dashboard/overview")
      .then(setData)
      .catch((e) => toast(`Could not load dashboard: ${e.message}`, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    );
  }

  const cards = [
    ["Total Students", data.totalStudents, Users, true],
    ["Total Complaints", data.totalComplaints, MessageSquareWarning, false],
    ["Pending Complaints", data.pendingComplaints, Clock, false],
    ["Resolved Complaints", data.resolvedComplaints, CheckCircle2, false],
  ];
  const trend = data.trend.slice(-range);
  const maxDept = Math.max(1, ...data.studentsByDepartment.map((d) => d.value));
  const maxFunnel = Math.max(1, ...data.funnel.map((f) => f.count));
  const hasComplaints = data.totalComplaints > 0;

  return (
    <div className="space-y-4">
      {/* Metric cards — real API counts only, no invented percentages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([label, value, Icon, peach]) => (
          <div key={label} className={"card card-hover pop-in " + (peach ? "!bg-peach !border-[#ffd9ae]" : "")}>
            <div className="flex items-start justify-between">
              <span className="text-[12px] text-muted font-medium">{label}</span>
              <span className="bg-primary text-white p-1.5 rounded-md">
                <Icon size={14} />
              </span>
            </div>
            <div className="metric-value mt-1.5">{Number(value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Complaint analytics — real trend from the API */}
        <div className="card xl:col-span-2 h-full flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title">Complaint Analytics</h3>
            <select
              className="input !w-auto !h-8 text-[12px]"
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          {trend.length ? (
            <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="submitted" stroke="#FF8900" strokeWidth={2.5} name="Submitted" />
                <Line type="monotone" dataKey="resolved" stroke="#FFAA45" strokeDasharray="5 5" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No complaints yet"
              description="The trend chart will appear here once complaints are submitted."
              actionLabel="Submit your first complaint"
              onAction={() => navigate("/complaints")}
            />
          )}
        </div>

        {/* Resolution target — computed rate, only meaningful with real data */}
        <div className="card h-full flex flex-col min-w-0">
          <h3 className="card-title">Complaint Resolution Target</h3>
          {hasComplaints ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative w-[132px] h-[132px] mx-auto my-3">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#FFE9D2" strokeWidth="11" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#FF8900"
                    strokeWidth="11"
                    strokeDasharray={`${data.resolutionRate * 2.64} 264`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray .7s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[22px] font-bold leading-none">{data.resolutionRate}%</div>
                    <div className="text-[11px] text-muted mt-1">resolved</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 bg-[#faf8f5] border border-line rounded-lg text-center">
                <div className="p-2">
                  <div className="text-[11px] text-muted">Target</div>
                  <b>{data.target}%</b>
                </div>
                <div className="p-2 border-l border-line">
                  <div className="text-[11px] text-muted">Actual</div>
                  <b>{data.resolutionRate}%</b>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No complaints yet"
              description="The resolution rate will appear here once complaints are submitted."
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Students by department — real student records */}
        <div className="card h-full flex flex-col min-w-0">
          <h3 className="card-title mb-3">Students by Department</h3>
          {data.studentsByDepartment.length ? (
            <div className="flex-1">
            {data.studentsByDepartment.map((d) => (
              <div key={d.name} className="mb-2.5">
                <div className="flex justify-between text-[12px]">
                  <span>{d.name}</span>
                  <b>{d.value}</b>
                </div>
                <div className="h-1.5 bg-peach rounded-full mt-1 overflow-hidden">
                  <div className="progress-bar" style={{ width: `${(d.value / maxDept) * 100}%` }} />
                </div>
              </div>
            ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No students yet"
              description="Students added by the admin will be grouped here by department."
              actionLabel="Go to Students"
              to="/students"
            />
          )}
        </div>

        {/* Processing funnel — exact real counts per status */}
        <div className="card h-full flex flex-col min-w-0">
          <h3 className="card-title mb-3">Complaint Processing Funnel</h3>
          {hasComplaints ? (
            <div className="flex-1">
            {data.funnel.map((f, i) => (
              <div key={f.stage} className="mb-2">
                <div className="flex justify-between text-[12px]">
                  <span>{f.stage}</span>
                  <b>{f.count}</b>
                </div>
                <div className="h-4 rounded-md bg-[#faf6f0] overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${Math.max(f.count ? 8 : 0, (f.count / maxFunnel) * 100)}%`,
                      background: COLORS[i % COLORS.length],
                      transition: "width .7s cubic-bezier(.22,.8,.3,1)",
                    }}
                  />
                </div>
              </div>
            ))}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No complaints yet"
              description="The funnel fills as complaints move through their statuses."
            />
          )}
        </div>

        {/* Categories donut — real distribution */}
        <div className="card h-full flex flex-col min-w-0">
          <h3 className="card-title">Complaint Categories</h3>
          {data.categories.length ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={168}>
                <PieChart>
                  <Pie data={data.categories} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3}>
                    {data.categories.map((c, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {data.categories.map((c, i) => (
                <div key={c.name} className="flex justify-between py-1 text-[12px]">
                  <span>
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <b>{c.value}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareWarning}
              title="No complaints yet"
              description="Category distribution will appear here once complaints are submitted."
            />
          )}
        </div>
      </div>

      {/* Recent complaints */}
      <div className="card flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <h3 className="card-title">Recent Complaints</h3>
          <Link to="/complaints" className="text-primary text-[12px] font-semibold">
            See All
          </Link>
        </div>
        {data.recentComplaints.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.recentComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td>{c.complaintId}</td>
                    <td>{c.studentName}</td>
                    <td>{c.category}</td>
                    <td>
                      <span className="badge">{c.priority}</span>
                    </td>
                    <td>{String(c.createdAt).slice(0, 10)}</td>
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
            icon={Inbox}
            title="No complaints yet"
            description="Recently submitted complaints will appear here."
            actionLabel="Submit a complaint"
            onAction={() => navigate("/complaints")}
          />
        )}
      </div>

      {/* Recent activity — real activity records */}
      {data.recentActivity?.length > 0 && (
        <div className="card">
          <h3 className="card-title mb-2">Recent Activity</h3>
          {data.recentActivity.map((a) => (
            <div key={a.id} className="flex justify-between py-1.5 border-t border-[#f4f1ec] first:border-0 text-[12px]">
              <span>
                <b>{a.action}</b> — {a.detail}
              </span>
              <span className="text-muted shrink-0 ml-3">{new Date(a.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
