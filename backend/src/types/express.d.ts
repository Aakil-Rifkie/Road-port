import { PublicUser } from "./user";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
