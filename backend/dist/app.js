"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const router_1 = require("./api/router");
function createApp() {
  const app = (0, express_1.default)();
  app.use(
    (0, cors_1.default)({
      origin: true,
      credentials: true
    })
  );
  app.use((0, helmet_1.default)());
  app.use(express_1.default.json({ limit: "2mb" }));
  app.use((0, cookie_parser_1.default)());
  app.use((0, router_1.buildRouter)());
  app.use((err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({
      message,
      stack:
        process.env.NODE_ENV === "development" && err instanceof Error
          ? err.stack
          : undefined
    });
  });
  return app;
}
