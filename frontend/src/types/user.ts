export type UserRole = "user" | "admin";

export interface PublicUser {
  id: string;
  fullname: string;
  email: string;
  role: UserRole;
}
