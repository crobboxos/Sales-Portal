import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { verifyPortalToken } from "./jwt";

const AUTH_COOKIE_NAME = "portal_token";

export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (env.AUTH_BYPASS) {
    req.user = {
      email: env.DEFAULT_USER_EMAIL,
      roles: ["salesperson"]
    };
    next();
    return;
  }

  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;

  const token = req.cookies?.[AUTH_COOKIE_NAME] ?? bearer;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyPortalToken(token);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication token", error: String(error) });
  }
}