export interface CreateReportBody {
  title?: string;
  description?: string;
  type: "pothole" | "crack" | "noise" | "smell" | "flooding";
  latitude: number;
  longitude: number;
  images?: string[];
}