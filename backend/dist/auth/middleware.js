"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthCookieName = getAuthCookieName;
exports.authMiddleware = authMiddleware;
const env_1 = require("../config/env");
const jwt_1 = require("./jwt");
const AUTH_COOKIE_NAME = "portal_token";
function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}
function authMiddleware(req, res, next) {
  if (env_1.env.AUTH_BYPASS) {
    req.user = {
      email: env_1.env.DEFAULT_USER_EMAIL,
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
    req.user = (0, jwt_1.verifyPortalToken)(token);
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid authentication token", error: String(error) });
  }
}
