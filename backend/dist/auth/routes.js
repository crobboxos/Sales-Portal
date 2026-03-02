"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const middleware_1 = require("./middleware");
const jwt_1 = require("./jwt");
const loginSchema = zod_1.z.object({
  email: zod_1.z.string().email(),
  sfUserId: zod_1.z.string().optional()
});
async function loginHandler(req, res) {
  if (!env_1.env.AUTH_BYPASS) {
    res.status(501).json({
      message: "SSO callback integration required in this environment."
    });
    return;
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid login payload",
      errors: parsed.error.flatten()
    });
    return;
  }
  const token = (0, jwt_1.signPortalToken)({
    email: parsed.data.email,
    sfUserId: parsed.data.sfUserId,
    roles: ["salesperson"]
  });
  res.cookie((0, middleware_1.getAuthCookieName)(), token, {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000
  });
  res.status(200).json({ success: true });
}
