import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { pool } from "../config/db";
import { CreateReportBody } from "../types/report";

export const createReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, type, latitude, longitude, images } =
      req.body as CreateReportBody;

    if (!title || !type || latitude == null || longitude == null) {
      res.status(400);
      throw new Error("Missing required fields");
    }

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
      if (images && images.length > 0) {
        for (const url of images) {
          await client.query(
            `INSERT INTO attachments (report_id, url) 
                    VALUES ($1, $2)`,
            [newReport.id, url],
          );
        }
      }

      await client.query("COMMIT");
      res.status(201).json({ ...newReport, images: images || [] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

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
        r.create_at,
        r.resolved_at,
        u.fullname AS reported_by,
        COALESCE(JSON_AGG(a.url) FILTER (WHERE a.url IS NOT NULL), '[]') AS images
        FROM reports r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN attachments a ON a.report_id = r.id  
        GROUP BY r.id, u.fullname                     
        ORDER BY r.created_at DESC
        `,
  );
});
