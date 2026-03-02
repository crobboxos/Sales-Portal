import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { getAuthCookieName } from "./middleware";
import { signPortalToken } from "./jwt";

const loginSchema = z.object({
  email: z.string().email(),
  sfUserId: z.string().optional()
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
  if (!env.AUTH_BYPASS) {
    res.status(501).json({ message: "SSO callback integration required in this environment." });
    return;
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid login payload", errors: parsed.error.flatten() });
    return;
  }

  const token = signPortalToken({
    email: parsed.data.email,
    sfUserId: parsed.data.sfUserId,
    roles: ["salesperson"]
  });

  res.cookie(getAuthCookieName(), token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000
  });

  res.status(200).json({ success: true });
}