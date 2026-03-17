import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { pool } from "../config/db.js";
import { CreateReportBody } from "../types/report.js";

/* Register, POST /api/reports */
export const createReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, type, latitude, longitude } =
      req.body as CreateReportBody;

    const allowedTypes = ["pothole", "crack", "noise", "smell", "flooding"];

    if (!title || !type || latitude == null || longitude == null) {
      res.status(400);
      throw new Error("Missing required fields");
    }

    if (!allowedTypes.includes(type)) {
      res.status(400);
      throw new Error(
        `Invalid type. Must be one of: ${allowedTypes.join(", ")}`,
      );
    }

    const files = req.files as Express.Multer.File[];
    const imageNames = files ? files.map((file) => file.filename) : [];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const reportResult = await client.query(
        `INSERT INTO reports (user_id, title, description, type, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [req.user!.id, title, description, type, latitude, longitude],
      );

      const newReport = reportResult.rows[0];
      for (const name of imageNames) {
        await client.query(
          `INSERT into attachments (report_id, url) VALUES ($1, $2)`,
          [newReport.id, name],
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ ...newReport, images: imageNames || [] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

/* Get Reports, GET /api/reports */
export const getReports = asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(
    `
        SELECT
        r.id,
        r.title,
        r.description,
        r.type,
        r.latitude,
        r.longitude,
        r.created_at, 
        r.resolved_at,
        u.fullname AS reported_by,
        COALESCE(JSON_AGG(a.url) FILTER (WHERE a.url IS NOT NULL), '[]') AS images
        FROM reports r
        JOIN users u ON r.user_id = u.id 
        LEFT JOIN attachments a ON a.report_id = r.id  
        WHERE r.resolved_at IS NULL 
        GROUP BY r.id, u.fullname                 
        ORDER BY r.created_at DESC 
        `,
  );

  res.status(200).json(result.rows);
});

/* RESOLVE, POST /api/reports/:id/resolve */
export const solveReport = asyncHandler(async (req: Request, res: Response) => {
  const reportId = req.params.id;
  const userId = req.user!.id;

  const existing = await pool.query(
    "SELECT * FROM report_resolutions WHERE report_id = $1 AND user_id = $2",
    [reportId, userId],
  );

  if (existing.rowCount && existing.rowCount > 0) {
    res.status(400);
    throw new Error("You have already marked this as resolved");
  }

  await pool.query(
    "INSERT INTO report_resolutions (report_id, user_id) VALUES ($1, $2)",
    [reportId, userId],
  );

  const voteCountResult = await pool.query(
    "SELECT COUNT(*) FROM report_resolutions WHERE report_id = $1",
    [reportId],
  );

  const count = parseInt(voteCountResult.rows[0].count);

  if (count >= 5) {
    await pool.query("UPDATE reports SET resolved_at = NOW() WHERE id = $1", [
      reportId,
    ]);
  }

  res.status(200).json({
    message: "Resolution vote recorded",
    currentVotes: count,
    isResolved: count >= 5,
  });
});
