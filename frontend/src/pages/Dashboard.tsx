import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import type { CreateReportContent } from "../types/report";
import ReportDetails from "../components/ReportDetails";
import MapLegend from "../components/MapLegend";
import { getMarkerIcon, getActiveMarkerIcon } from "../utils/markerUtils";
import HeatmapLayer from "../components/HeatmapLayer";
import MapSearch from "../components/MapSearch";

const createCustomClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full border-4 border-yellow-400 shadow-xl group">
        <span class="text-xs font-black font-mono tracking-tighter">${count}</span>
      </div>
    `,
    className: "custom-marker-cluster",
    iconSize: L.point(40, 40),
  });
};

const COLOMBO_LAND_BOUNDS = {
  latMin: 6.82,
  latMax: 6.98,
  lngMin: 79.841,
  lngMax: 79.95,
};

function ClickHandler({
  setCoord,
}: {
  setCoord: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const isOnLand =
        lat >= COLOMBO_LAND_BOUNDS.latMin &&
        lat <= COLOMBO_LAND_BOUNDS.latMax &&
        lng >= COLOMBO_LAND_BOUNDS.lngMin &&
        lng <= COLOMBO_LAND_BOUNDS.lngMax;

      if (isOnLand) {
        setCoord([lat, lng]);
      } else {
        console.warn("Click ignored: Outside land boundaries.");
      }
    },
  });
  return null;
}

interface Props {
  onLogout: () => void;
}

const reportTypes = ["pothole", "crack", "noise", "smell", "flooding"];

export default function Dashboard({ onLogout }: Props) {
  const navigate = useNavigate();
  const colomboCenter: [number, number] = [6.9339, 79.85];

  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null);
  const [reportType, setReportType] = useState("pothole");
  const [allReports, setAllReports] = useState<CreateReportContent[]>([]);
  const [selectedReport, setSelectedReport] = useState<CreateReportContent | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [heatmap, setHeatmap] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: boolean; description?: boolean }>({});

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
    if (!reportLocation && !selectedReport) {
      setPanelVisible(false);
      return;
    }
    setPanelVisible(false);
    const timeout = setTimeout(() => setPanelVisible(true), 100);
    return () => clearTimeout(timeout);
  }, [reportLocation, selectedReport]);

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => {
      setReportLocation(null);
      setSelectedReport(null);
      setTitle("");
      setDescription("");
      setPhoto(null);
      setErrors({});
    }, 400);
  };

  const handleLogout = async () => {
    await API.post("/users/logout", {}, { withCredentials: true });
    localStorage.removeItem("user");
    onLogout();
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: boolean; description?: boolean } = {};
    if (!title.trim()) newErrors.title = true;
    if (!description.trim()) newErrors.description = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
      handleClosePanel();
      fetchReports();
    } catch (err) {
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
            attribution="&copy; CARTO"
          />
          <ClickHandler
            setCoord={(coord) => {
              setSelectedReport(null);
              setReportLocation(coord);
            }}
          />

          {heatmap && <HeatmapLayer reports={allReports} />}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            iconCreateFunction={createCustomClusterIcon}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {allReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={getMarkerIcon(report.type)}
                eventHandlers={{
                  click: () => {
                    setReportLocation(null);
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
          className={`absolute top-[84px] left-[10px] z-[1000] w-[34px] h-[34px] flex items-center justify-center rounded-md shadow-md border-2 transition-all duration-200 text-lg ${heatmap ? "bg-black text-white border-black" : "bg-white text-black border-gray-200 hover:bg-gray-50"}`}
        >
          {heatmap ? "⬢" : "⬡"}
        </button>

        <div
          className="absolute top-4 right-4 z-[1000]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleLogout}
            className="bg-white border border-gray-200 text-gray-500 hover:text-gray-900
                       hover:border-gray-400 text-[10px] font-black uppercase tracking-widest
                       px-3 py-2 rounded-xl shadow-md transition-all duration-200"
          >
            Logout →
          </button>
        </div>

        <MapLegend />
      </div>

      <div
        className={responsivePanelClasses}
        style={{ zIndex: selectedReport ? 1005 : 1002 }}
      >
        {selectedReport ? (
          <ReportDetails
            report={selectedReport}
            onClose={handleClosePanel}
            onResolved={fetchReports}
          />
        ) : reportLocation ? (
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  New Report
                </h2>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">
                  {reportLocation[0].toFixed(4)} , {reportLocation[1].toFixed(4)}
                </p>
              </div>
              <button
                onClick={handleClosePanel}
                className="text-3xl leading-none transition-transform hover:scale-110"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    Issue Title
                  </label>
                  {errors.title && (
                    <span className="text-[9px] font-black text-red-500 uppercase italic animate-pulse tracking-tighter">
                      Required
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: false });
                  }}
                  className={`w-full border-b-2 py-2 outline-none transition-all placeholder:text-gray-200 ${errors.title ? "border-red-500 bg-red-50/30" : "border-gray-100 focus:border-black"}`}
                  placeholder="Briefly name the issue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {reportTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReportType(t)}
                      className={`px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase transition-all ${reportType === t ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    Description
                  </label>
                  {errors.description && (
                    <span className="text-[9px] font-black text-red-500 uppercase italic animate-pulse tracking-tighter">
                      Details Missing
                    </span>
                  )}
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: false });
                  }}
                  className={`w-full flex-1 border-2 rounded-2xl p-4 outline-none transition-all resize-none min-h-[120px] ${errors.description ? "border-red-500 bg-red-50/30" : "border-gray-50 bg-gray-50 focus:bg-white focus:border-black"}`}
                  placeholder="Provide specific details..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  Evidence
                </label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-2xl py-6 cursor-pointer hover:bg-gray-50 transition-all">
                  <span className="text-xs font-bold uppercase text-gray-500">
                    {photo ? photo.name : "Attach Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-black hover:text-white text-black font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest mt-2 shadow-lg shadow-yellow-100"
              >
                Submit Report
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}