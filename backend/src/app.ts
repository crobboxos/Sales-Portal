import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { buildRouter } from "./api/router";

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.use(buildRouter());

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({
      message,
      stack: process.env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined
    });
  });

  return app;
}