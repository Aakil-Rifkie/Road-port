import L from "leaflet";

export const reportTypeColors: Record<string, string> = {
  pothole:  "#FBBF24",
  crack:    "#F97316",
  flooding: "#3B82F6",
  noise:    "#A855F7",
  smell:    "#10B981",
};

const defaultColor = "#6B7280";

export function getMarkerIcon(type: string): L.DivIcon {
  const color = reportTypeColors[type] ?? defaultColor;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: ${color};
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25), 0 0 0 3px ${color}33;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function getActiveMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #1F2937;
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 0 0 4px rgba(31,41,55,0.2);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}