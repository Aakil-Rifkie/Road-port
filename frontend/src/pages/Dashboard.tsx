import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import type { CreateReportContent } from "../types/report";
import ReportDetails from "../components/ReportDetails";
import MapLegend from "../components/MapLegend";
import { getMarkerIcon, getActiveMarkerIcon } from "../utils/markerUtils";
import HeatmapLayer from "../components/HeatmapLayer";
import MapSearch from "../components/MapSearch";

function ClickHandler({
  setCoord,
}: {
  setCoord: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setCoord([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const reportTypes = ["pothole", "crack", "noise", "smell", "flooding"];

export default function Dashboard() {
  const colomboCenter: [number, number] = [6.9339, 79.85];
  const [reportLocation, setReportLocation] = useState<[number, number] | null>(
    null,
  );
  const [reportType, setReportType] = useState("pothole");
  const [allReports, setAllReports] = useState<CreateReportContent[]>([]);
  const [selectedReport, setSelectedReport] =
    useState<CreateReportContent | null>(null);

  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [heatmap, setHeatmap] = useState(false);

  const isFirst = useRef(true);

  const fetchReports = async () => {
    try {
      const { data } = await API.get("/reports", { withCredentials: true });
      setAllReports(data);
    } catch (err) {
      console.error("Failed to load reports", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (reportLocation === null) {
      setVisible(false);
      return;
    }
    if (isFirst.current) {
      isFirst.current = false;
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 120);
      return () => clearTimeout(t);
    }
  }, [reportLocation]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setReportLocation(null);
      isFirst.current = true;
      setTitle("");
      setDescription("");
      setPhoto(null);
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportLocation) return;

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", reportType);
      formData.append("latitude", String(reportLocation[0]));
      formData.append("longitude", String(reportLocation[1]));
      if (photo) formData.append("images", photo);

      await API.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      handleClose();
      fetchReports();
    } catch (err: any) {
      console.error("Submission Error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="h-screen w-full relative flex overflow-hidden font-mono">
      <div className="flex-1 z-0">
        <MapContainer
          center={colomboCenter}
          zoom={14}
          minZoom={12}
          maxZoom={18}
          maxBounds={[
            [6.7, 79.7],
            [7.1, 80.1],
          ]}
          maxBoundsViscosity={1.0}
          className="h-full w-full"
        >
          <MapSearch />
           
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <ClickHandler setCoord={setReportLocation} />

          {heatmap ? (
            <HeatmapLayer reports={allReports} />
          ) : (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
              {allReports.map((report) => (
                <Marker
                  key={report.id}
                  position={[report.latitude, report.longitude]}
                  icon={getMarkerIcon(report.type)}
                  eventHandlers={{
                    click: () => {
                      handleClose();
                      setSelectedReport(report);
                    },
                  }}
                />
              ))}
            </MarkerClusterGroup>
          )}

          <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
            {allReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={getMarkerIcon(report.type)}
                eventHandlers={{
                  click: () => {
                    handleClose();
                    setSelectedReport(report);
                  },
                }}
              />
            ))}
          </MarkerClusterGroup>

          {reportLocation && (
            <Marker position={reportLocation} icon={getActiveMarkerIcon()} />
          )}
        </MapContainer>
        <button
          onClick={() => setHeatmap((v) => !v)}
          className={`absolute top-24 left-4 z-[1000] px-3 py-2 rounded-xl text-xs font-bold
              uppercase tracking-widest shadow-md transition-all duration-200
              ${
                heatmap
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
        >
          {heatmap ? "⬡ Heatmap" : "⬡ Heatmap"}
        </button>
        <MapLegend />
      </div>

      {selectedReport && (
        <ReportDetails
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolved={fetchReports}
        />
      )}

      {reportLocation && (
        <div
          className="absolute right-0 top-0 h-full w-full md:w-[380px] z-[1001]
                     transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: visible ? "translateX(0%)" : "translateX(105%)" }}
        >
          <div className="absolute inset-0 bg-white shadow-2xl" />

          <div className="relative h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  New Report
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                  {reportLocation[0].toFixed(5)}, {reportLocation[1].toFixed(5)}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black
                           transition-colors text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="h-0.5 w-12 bg-yellow-400 rounded-full mb-5" />

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 flex-1"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Issue Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Pothole"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300
                             focus:border-yellow-400 transition-all placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Report Category
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-yellow-300 outline-none appearance-none cursor-pointer"
                >
                  {reportTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the road hazard in detail..."
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300
                             focus:border-yellow-400 transition-all resize-none h-28
                             placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Photo
                </label>
                <label
                  className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200
                             rounded-xl px-3 py-3 cursor-pointer hover:border-yellow-400
                             hover:bg-yellow-50 transition-all group"
                >
                  <span className="text-gray-400 group-hover:text-yellow-500 transition-colors text-lg">
                    ↑
                  </span>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors truncate">
                    {photo ? photo.name : "Click to upload a photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="flex-1" />

              <button
                type="submit"
                className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl
                           hover:bg-yellow-500 active:scale-[0.98] transition-all duration-150
                           text-sm tracking-wide shadow-sm shadow-yellow-200"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
