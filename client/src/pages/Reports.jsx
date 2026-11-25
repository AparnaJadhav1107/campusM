import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api, csvUrl } from "../services/api.js";
import { useAuthStore } from "../store/index.js";

const COLORS = ["#FF8900", "#FFAA45", "#FFC078", "#16A36A", "#EF4444"];
const RANGES = [
  ["today", "Today"],
  [7, "Last 7 days"],
  [30, "Last 30 days"],
  [90, "Last 90 days"],
];

export default function Reports() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState(30);
  const token = useAuthStore((s) => s.token);

  const load = () => {
    const from =
      range === "today"
        ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        : new Date(Date.now() - range * 86400000).toISOString();
    api(`/reports?from=${from}`).then(setData);
  };
  useEffect(load, [range]);

  const download = async () => {
    const response = await fetch(csvUrl, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "complaints-report.csv";
    a.click();
  };

  if (!data) return <div className="skeleton" />;
  const empty = data.total === 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {RANGES.map(([value, label]) => (
          <button key={label} className={range === value ? "btn-primary" : "btn-ghost"} onClick={() => setRange(value)}>
            {label}
          </button>
        ))}
        <button className="btn-ghost ml-auto" onClick={download}>
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ["Total", data.total],
          ["Resolved", data.resolved],
          ["Pending", data.pending],
        ].map(([label, value]) => (
          <div key={label} className="card card-hover">
            <div className="text-muted text-[12px]">{label} Complaints</div>
            <div className="metric-value mt-1">{value}</div>
            {label === "Resolved" && (
              <div className="text-[11px] text-muted mt-0.5">
                {data.avgResolutionDays === null
                  ? "Average resolution time appears once a complaint is resolved"
                  : `Avg resolution: ${data.avgResolutionDays} days (computed from real records)`}
              </div>
            )}
          </div>
        ))}
      </div>

      {empty ? (
        <div className="card text-muted text-center py-10">
          No complaints in this range — reports are computed live from real complaint records.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="card-title mb-2">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.categories}>
                <CartesianGrid stroke="#f0ebe3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#FF8900" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="card-title mb-2">Department-wise Complaints</h3>
            {data.departments.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.departments} dataKey="value" innerRadius={48} outerRadius={78}>
                    {data.departments.map((x, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted py-8 text-center">No department data yet.</p>
            )}
          </div>
          <div className="card lg:col-span-2">
            <h3 className="card-title mb-2">Trend (selected range)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trend}>
                <CartesianGrid stroke="#f0ebe3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line dataKey="submitted" stroke="#FF8900" strokeWidth={2.5} />
                <Line dataKey="resolved" stroke="#16A36A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
