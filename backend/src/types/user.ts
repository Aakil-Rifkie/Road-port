export type UserRole = "user" | "admin";

export interface DbUser {
  id: string;
  fullname: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  fullname: string;
  email: string;
  role: UserRole;
}
