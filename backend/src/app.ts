import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js"
import { errorHandler } from "./middleware/errorMiddleware.js";


const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler)

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});



export default app;
