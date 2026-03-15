import type { CreateReportContent } from '../types/report'

interface Props {
  report: CreateReportContent;
  onClose: () => void;
}

export default function ReportDetails({ report, onClose }: Props) {
  return (
    <div className="absolute right-0 top-0 h-full w-full md:w-[380px] bg-white shadow-2xl z-[1001] flex flex-col font-mono animate-in slide-in-from-right">

      <div className="relative h-48 bg-gray-200">
        {report.images && report.images[0] ? (
          <img 
            src={`http://localhost:3000/uploads/${report.images[0]}`} 
            className="w-full h-full object-cover" 
            alt="Report" 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No Image Provided</div>
        )}
        <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full">&times;</button>
      </div>

      <div className="p-6">
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-md">
          {report.type}
        </span>
        <h2 className="text-2xl font-black mt-2 leading-tight">{report.title}</h2>
        <p className="text-gray-500 text-sm mt-4 leading-relaxed">{report.description}</p>
        
        <div className="mt-6 pt-6 border-t border-gray-100 text-[11px] text-gray-400">
          <p>Reported by: {report.reported_by}</p>
          <p>Date: {new Date(report.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}