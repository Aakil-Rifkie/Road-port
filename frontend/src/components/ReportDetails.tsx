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
    setError(""); setVotes(null); setHasVoted(false); setLoading(false);
  }, [report.id]);

  const accentColor = reportTypeColors[report.type] ?? "#000000";

  const handleResolve = async () => {
    setLoading(true);
    try {
      const { data } = await API.patch(`/reports/${report.id}/resolve`, {}, { withCredentials: true });
      setVotes(data.currentVotes);
      setHasVoted(true);
      if (data.isResolved) { onResolved(); onClose(); }
    } catch (err: any) {
      setHasVoted(true);
      setError("Vote could not be processed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white font-mono">
      <div className="relative w-full h-48 md:h-64 bg-gray-100 flex-shrink-0 overflow-hidden">
        {report.images?.[0] ? (
          <>
            <img
              src={`http://localhost:3000/uploads/${report.images[0]}`}
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
              alt="Background Blur"
            />
            <img
              src={`http://localhost:3000/uploads/${report.images[0]}`}
              className="relative w-full h-full object-contain"
              alt="Report Detail"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] font-bold text-gray-300 uppercase italic">
            No image provided
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur text-black w-10 h-10 rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-white hover:scale-110 transition-all"
        >
          ×
        </button>
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="inline-block px-2 py-1 mb-4 text-[10px] font-black uppercase tracking-widest border-2" 
               style={{ borderColor: accentColor, color: accentColor }}>
            {report.type}
          </div>

          <h2 className="text-2xl font-black italic uppercase leading-tight mb-4">{report.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">{report.description}</p>

          <div className="space-y-2 border-t pt-6 border-gray-100">
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span className="text-gray-400">Reporter</span>
              <span className="text-black">{report.reported_by}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span className="text-gray-400">Timestamp</span>
              <span className="text-black">{new Date(report.created_at).toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 bg-white">
          {votes !== null && (
            <div className="mb-4 bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-700 ease-out" 
                style={{ width: `${(votes / 5) * 100}%` }}
              />
            </div>
          )}
          
          <button
            onClick={handleResolve}
            disabled={hasVoted || loading}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
              ${hasVoted ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-yellow-400 hover:bg-black hover:text-white text-black shadow-lg shadow-yellow-100"}`}
          >
            {loading ? "Syncing..." : hasVoted ? "✓ Verified" : "Confirm Issue"}
          </button>
          
          {error && <p className="text-[10px] text-red-500 mt-3 text-center font-bold uppercase">{error}</p>}
        </div>
      </div>
    </div>
  );
}