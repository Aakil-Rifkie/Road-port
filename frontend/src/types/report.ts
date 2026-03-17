export interface CreateReportContent {
  id: number;
  title: string;
  description: string;
  type: "pothole" | "crack" | "noise" | "smell" | "flooding";
  latitude: number;
  longitude: number;
  created_at: string;
  images: string[]; 
  reported_by: string;
  resolved_at: string | null;
}