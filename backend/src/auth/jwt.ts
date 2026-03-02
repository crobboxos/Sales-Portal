import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticatedUser } from "../types/auth";

interface PortalJwtPayload {
  email: string;
  sfUserId?: string;
  roles?: string[];
}

export function signPortalToken(payload: PortalJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h"
  });
}

export function verifyPortalToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as PortalJwtPayload;
  if (!decoded.email) {
    throw new Error("Token missing email claim");
  }

  return {
    email: decoded.email,
    sfUserId: decoded.sfUserId,
    roles: decoded.roles ?? ["salesperson"]
  };
}
