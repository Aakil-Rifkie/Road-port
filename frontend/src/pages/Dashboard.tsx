import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import API from "../api/axios";
import type { CreateReportContent } from "../types/report";
import ReportDetails from "../components/ReportDetails";
import MapLegend from "../components/MapLegend";
import { getMarkerIcon, getActiveMarkerIcon } from "../utils/markerUtils";
import HeatmapLayer from "../components/HeatmapLayer";
import MapSearch from "../components/MapSearch";

function ClickHandler({ setCoord }: { setCoord: (coords: [number, number]) => void }) {
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
  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null);
  const [reportType, setReportType] = useState("pothole");
  const [allReports, setAllReports] = useState<CreateReportContent[]>([]);
  const [selectedReport, setSelectedReport] = useState<CreateReportContent | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [heatmap, setHeatmap] = useState(false);

  const fetchReports = async () => {
    try {
      const { data } = await API.get("/reports", { withCredentials: true });
      setAllReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    if (!reportLocation) {
      setPanelVisible(false);
      return;
    }

    setSelectedReport(null);
    setPanelVisible(false); 
    
    const timeout = setTimeout(() => {
      setPanelVisible(true); 
    }, 100);

    return () => clearTimeout(timeout);
  }, [reportLocation]);

  useEffect(() => {
    if (!selectedReport) {
      setPanelVisible(false);
      return;
    }

    setReportLocation(null);
    setPanelVisible(false); 
    
    const timeout = setTimeout(() => {
      setPanelVisible(true); 
    }, 100);

    return () => clearTimeout(timeout);
  }, [selectedReport]);

  const handleCloseCreate = () => {
    setPanelVisible(false);
    setTimeout(() => {
      setReportLocation(null);
      setTitle("");
      setDescription("");
      setPhoto(null);
    }, 400);
  };

  const handleMarkerClick = (report: CreateReportContent) => {
    setSelectedReport(report);
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
      handleCloseCreate();
      fetchReports();
    } catch (err: any) {
      console.error(err);
    }
  };

  const responsivePanelClasses = `fixed md:absolute bottom-0 right-0 z-[1002] w-full md:w-[400px] 
                   h-[90vh] md:h-full bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] 
                   md:shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
                   flex flex-col rounded-t-3xl md:rounded-none overflow-hidden
                   ${panelVisible ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"}`;

  return (
    <div className="h-screen w-full relative flex overflow-hidden font-mono bg-gray-50 text-black">
      <div className="flex-1 z-0 relative">
        <MapContainer
          center={colomboCenter}
          zoom={14}
          minZoom={12}
          maxZoom={18}
          maxBounds={[[6.7, 79.7], [7.1, 80.1]]}
          maxBoundsViscosity={1.0}
          className="h-full w-full"
        >
          <MapSearch />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          <ClickHandler setCoord={setReportLocation} />

          <div className={heatmap ? "pointer-events-none" : ""}>
            {heatmap && <HeatmapLayer reports={allReports} />}
          </div>

          <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
            {allReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={getMarkerIcon(report.type)}
                eventHandlers={{
                  click: () => handleMarkerClick(report),
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
          className={`absolute top-[84px] left-[10px] z-[1000] w-[34px] h-[34px] 
                     flex items-center justify-center rounded-md shadow-md border-2
                     transition-all duration-200 text-lg
                     ${heatmap ? "bg-black text-white border-black" : "bg-white text-black border-gray-200 hover:bg-gray-50"}`}
        >
          {heatmap ? "⬢" : "⬡"}
        </button>
        <MapLegend />
      </div>

      <div className={responsivePanelClasses} style={{ zIndex: selectedReport ? 1005 : 1002 }}>
          {selectedReport ? (
            <ReportDetails
              report={selectedReport}
              onClose={() => setSelectedReport(null)}
              onResolved={fetchReports}
            />
          ) : reportLocation ? (
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">New Report</h2>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                    {reportLocation[0].toFixed(4)} , {reportLocation[1].toFixed(4)}
                  </p>
                </div>
                <button onClick={handleCloseCreate} className="text-3xl leading-none transition-transform hover:scale-110">×</button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Issue Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full border-b-2 border-gray-100 py-2 focus:border-black outline-none transition-colors placeholder:text-gray-200"
                    placeholder="Briefly name the issue"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {reportTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReportType(t)}
                        className={`px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase transition-all
                                   ${reportType === t ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full flex-1 border-2 border-gray-50 bg-gray-50 rounded-2xl p-4 focus:bg-white focus:border-black outline-none transition-all resize-none min-h-[120px]"
                    placeholder="Provide specific details..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Evidence</label>
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-2xl py-6 cursor-pointer hover:bg-gray-50 transition-all">
                    <span className="text-xs font-bold uppercase text-gray-500">{photo ? photo.name : "Attach Photo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                  </label>
                </div>

                <button type="submit" className="w-full bg-yellow-400 hover:bg-black hover:text-white text-black font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest mt-2">
                  Submit Report
                </button>
              </form>
            </div>
          ) : null}
      </div>
    </div>
  );
}