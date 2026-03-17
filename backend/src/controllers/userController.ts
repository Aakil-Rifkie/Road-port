import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import { pool } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { DbUser, PublicUser } from "../types/user.js";

/* Register, POST /api/users */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullname, email, password } = req.body as {
    fullname: string;
    email: string;
    password: string;
  };

  if (!fullname || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rowCount !== 0) {
    res.status(400);
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query<PublicUser>(
    `
    INSERT INTO users (fullname, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, fullname, email, role
    `,
    [fullname, email, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  res
    .status(201)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(user);
});

/* Login, POST /api/users/login */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  const result = await pool.query<DbUser>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user.id);

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    });
});

/* Logout, POST /api/users/logout */
export const logoutUser = asyncHandler(async (_req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    })
    .json({ message: "Logged out" });
});

/* Get current user, GET /api/users/me */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json(req.user);
});
