import express from 'express';
import {createReport, getReports, solveReport}from "../controllers/reportController.js"
import {protect} from "../middleware/authMiddleware.js";
import {upload} from "../middleware/fileUploadMiddleware.js"

const router = express.Router();

router.get("/", getReports);

router.post("/", protect, upload.array("images", 5), createReport)

router.patch("/:id/resolve", protect, solveReport);

export default router;