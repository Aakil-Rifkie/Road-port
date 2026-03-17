import { useState, useEffect } from "react";
import type { CreateReportContent } from "../types/report";
import API from "../api/axios";
import { reportTypeColors } from "../utils/markerUtils";


interface Props {
  report: CreateReportContent;
  onClose: () => void;
  onResolved: () => void;
}

export default function ReportDetails({ report, onClose, onResolved }: Props) {
  const [votes, setVotes] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    useEffect(() => {
    setError("");
    setVotes(null);
    setHasVoted(false);
    setLoading(false);
  }, [report.id]);

  const accentColor = reportTypeColors[report.type] ?? "#6B7280";

  const handleResolve = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.patch(
        `/reports/${report.id}/resolve`,
        {},
        { withCredentials: true }
      );
      setVotes(data.currentVotes);
      setHasVoted(true);
      if (data.isResolved) {
        onResolved();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to submit vote.";
      if (msg.toLowerCase().includes("already")) {
        setHasVoted(true);
        setError("You've already voted on this report.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-full md:w-[380px] bg-white shadow-2xl z-[1001] flex flex-col font-mono">

      <div className="relative h-44 bg-gray-100 flex-shrink-0">
        {report.images && report.images[0] ? (
          <img
            src={`http://localhost:3000/uploads/${report.images[0]}`}
            className="w-full h-full object-cover"
            alt="Report"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-400 uppercase tracking-widest">No Image</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="p-6 flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            {report.type}
          </span>
        </div>

        <h2 className="text-xl font-black leading-tight text-gray-900">{report.title}</h2>

        <div className="h-0.5 w-10 rounded-full my-3" style={{ backgroundColor: accentColor }} />

        <p className="text-sm text-gray-500 leading-relaxed">{report.description}</p>

        <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
          <p>Reported by <span className="text-gray-600 font-semibold">{report.reported_by}</span></p>
          <p>{new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>

        <div className="mt-auto pt-6">
          {error && (
            <p className="text-xs text-red-400 mb-2 text-center">{error}</p>
          )}

          {votes !== null && (
            <p className="text-xs text-gray-400 text-center mb-2">
              <span className="font-bold text-gray-700">{votes}</span> / 5 votes to resolve
            </p>
          )}

          <button
            onClick={handleResolve}
            disabled={hasVoted || loading}
            className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150
              ${hasVoted
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-500 active:scale-[0.98] text-black shadow-sm shadow-yellow-200"
              }`}
          >
            {loading ? "Submitting..." : hasVoted ? "✓ Vote Submitted" : "Mark as Resolved"}
          </button>
        </div>
      </div>
    </div>
  );
}