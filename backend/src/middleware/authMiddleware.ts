import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { pool } from "../config/db";
import { PublicUser } from "../types/user";

interface JwtPayload {
  userId: string;
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Not authorized");
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      const result = await pool.query<PublicUser>(
        `
        SELECT id, fullname, email, role
        FROM users
        WHERE id = $1
        `,
        [decoded.userId]
      );

      if (result.rowCount === 0) {
        res.status(401);
        throw new Error("User not found");
      }

      req.user = result.rows[0];
      next();
    } catch {
      res.status(401);
      throw new Error("Invalid token");
    }
  }
);

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};
