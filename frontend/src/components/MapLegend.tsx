import { reportTypeColors } from "../utils/markerUtils";

const labels: Record<string, string> = {
  pothole:  "Pothole",
  crack:    "Crack",
  flooding: "Flooding",
  noise:    "Noise",
  smell:    "Smell",
};

export default function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-white rounded-2xl shadow-lg px-4 py-3 font-mono hidden md:block">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
        Report Type
      </p>
      <div className="flex flex-col gap-2">
        {Object.entries(labels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white"
              style={{
                backgroundColor: reportTypeColors[type],
                boxShadow: `0 0 0 3px ${reportTypeColors[type]}33`,
              }}
            />
            <span className="text-xs text-gray-600 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}