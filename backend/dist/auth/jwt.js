"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPortalToken = signPortalToken;
exports.verifyPortalToken = verifyPortalToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signPortalToken(payload) {
  return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h"
  });
}
function verifyPortalToken(token) {
  const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
  if (!decoded.email) {
    throw new Error("Token missing email claim");
  }
  return {
    email: decoded.email,
    sfUserId: decoded.sfUserId,
    roles: decoded.roles ?? ["salesperson"]
  };
}
