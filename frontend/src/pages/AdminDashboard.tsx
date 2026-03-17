import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import type { CreateReportContent } from "../types/report";
import { reportTypeColors } from "../utils/markerUtils";

const reportTypes = ["pothole", "crack", "noise", "smell", "flooding"];

type FilterType = "all" | CreateReportContent["type"];

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  
  const navigate = useNavigate();
  const [reports, setReports] = useState<CreateReportContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };  
  

  const fetchReports = async () => {
    try {
      const { data } = await API.get("/reports", { withCredentials: true });
      setReports(data);
    } catch {
      console.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);
  

   const handleLogout = async () => {
    await API.post("/users/logout", {}, { withCredentials: true });
    localStorage.removeItem("user");
    onLogout();
    navigate("/");
  };

  const handleResolve = async (id: number) => {
    if (resolved.has(id)) {
      addToast("You've already voted on this report.", "info");
      return;
    }

    setResolving(id);
    try {
      const { data } = await API.patch(`/reports/${id}/resolve`, {}, { withCredentials: true });

      setResolved((prev) => new Set(prev).add(id));

      if (data.isResolved) {
        addToast("Report marked as resolved and removed from map.", "success");
        await fetchReports();
      } else {
        addToast(`Vote recorded. ${data.currentVotes}/5 votes to resolve.`, "success");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "";
      if (msg.toLowerCase().includes("already")) {
        setResolved((prev) => new Set(prev).add(id));
        addToast("You've already voted on this report.", "info");
      } else {
        addToast("Failed to submit vote. Try again.", "error");
      }
    } finally {
      setResolving(null);
    }
  };

  const filtered = reports.filter((r) => {
    const matchesType = filter === "all" || r.type === filter;
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reported_by.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: reports.length,
    byType: reportTypes.map((t) => ({
      type: t,
      count: reports.filter((r) => r.type === t).length,
    })),
  };

  const maxCount = Math.max(...stats.byType.map((s) => s.count), 1);

  const toastColors: Record<Toast["type"], string> = {
    success: "bg-black text-white",
    error: "bg-red-500 text-white",
    info: "bg-gray-700 text-white",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-mono">

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${toastColors[toast.type]} px-4 py-3 rounded-xl shadow-xl text-xs font-bold uppercase tracking-widest
                        animate-in slide-in-from-right duration-300 max-w-xs`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-sm font-black uppercase tracking-widest text-gray-900">
              RoadPort Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold uppercase tracking-widest text-gray-400
                       hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg
                       hover:bg-gray-100"
          >
            Logout →
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Active road reports across Colombo</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="col-span-2 md:col-span-3 lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Active</p>
            <p className="text-5xl font-black text-gray-900 mt-2 tabular-nums">
              {loading ? "—" : stats.total}
            </p>
            <p className="text-xs text-gray-400 mt-2">Unresolved reports</p>
          </div>

          {stats.byType.map(({ type, count }) => (
            <div key={type} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: reportTypeColors[type] }}>
                  {type}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: reportTypeColors[type] }} />
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : count}
              </p>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: loading ? "0%" : `${(count / maxCount) * 100}%`,
                    backgroundColor: reportTypeColors[type],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Reports</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search title or reporter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full sm:w-52"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer"
              >
                <option value="all">All types</option>
                {reportTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">Loading reports...</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No reports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Title", "Type", "Reported By", "Date", "Coords", "Action"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 px-6 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report, i) => {
                    const hasVoted = resolved.has(report.id);
                    const isResolving = resolving === report.id;

                    return (
                      <tr
                        key={report.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors
                          ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 max-w-[180px] truncate">
                          {report.title}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${reportTypeColors[report.type]}22`,
                              color: reportTypeColors[report.type],
                            }}
                          >
                            {report.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{report.reported_by}</td>
                        <td className="px-6 py-4 text-gray-400 tabular-nums whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-400 tabular-nums text-xs whitespace-nowrap">
                          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={isResolving}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5
                                       rounded-lg border transition-all whitespace-nowrap
                                       ${hasVoted
                                         ? "border-gray-100 text-gray-300 cursor-not-allowed"
                                         : "border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                       }`}
                          >
                            {isResolving ? "Voting..." : hasVoted ? "✓ Voted" : "Resolve"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}