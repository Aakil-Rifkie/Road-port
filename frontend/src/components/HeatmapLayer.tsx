import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { CreateReportContent } from "../types/report";

interface Props {
  reports: CreateReportContent[];
}

export default function HeatmapLayer({ reports }: Props) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number, number][] = reports.map((r) => [
      r.latitude,
      r.longitude,
      1,
    ]);

    const heat = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.2: "#3B82F6",
        0.5: "#FBBF24",
        0.8: "#F97316",
        1.0: "#EF4444",
      },
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [reports, map]);

  return null;
}