import { Router } from "express";
import { loginHandler } from "../auth/routes";
import { query } from "../db/pool";
import { asyncHandler } from "./asyncHandler";
import { authMiddleware } from "../auth/middleware";
import { runReferenceDataSync } from "../services/referenceSyncService";
import {
  addDealLine,
  createDeal,
  getDeal,
  getDealList,
  getDealStatus,
  getSubmission,
  removeDealLine,
  updateDeal,
  updateDealLine
} from "../services/dealService";
import { submitDeal, retrySubmission } from "../services/dealSubmissionService";
import { getPicklistValues, findAccounts, findProducts } from "../repositories/referenceRepository";
import { listSubmissions } from "../repositories/submissionRepository";

export function buildRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  router.post("/api/auth/login", asyncHandler(loginHandler));

  router.use("/api", authMiddleware);

  router.get(
    "/api/accounts",
    asyncHandler(async (req, res) => {
      const search = typeof req.query.q === "string" ? req.query.q : undefined;
      const accounts = await findAccounts(search);
      res.status(200).json({ records: accounts });
    })
  );

  router.get(
    "/api/products",
    asyncHandler(async (req, res) => {
      const lob = typeof req.query.lob === "string" ? req.query.lob : undefined;
      const currency = typeof req.query.currency === "string" ? req.query.currency : undefined;
      const products = await findProducts(lob, currency);
      res.status(200).json({ records: products });
    })
  );

  router.get(
    "/api/pricebooks",
    asyncHandler(async (_req, res) => {
      const result = await query(
        `
        SELECT DISTINCT
          sf_pricebook2_id AS "sfPricebook2Id",
          pricebook_name AS "pricebookName"
        FROM pricebook_entry_ref
        ORDER BY pricebook_name ASC;
      `
      );

      res.status(200).json({ records: result.rows });
    })
  );

  router.get(
    "/api/picklists/:objectApiName/:fieldApiName",
    asyncHandler(async (req, res) => {
      const { objectApiName, fieldApiName } = req.params;
      const values = await getPicklistValues(objectApiName, fieldApiName);
      res.status(200).json({ records: values });
    })
  );

  router.post(
    "/api/sync/reference-data",
    asyncHandler(async (_req, res) => {
      const result = await runReferenceDataSync();
      res.status(200).json({ success: true, ...result });
    })
  );

  router.post(
    "/api/deals",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      const deal = await createDeal(req.body, user.email);
      res.status(201).json(deal);
    })
  );

  router.put(
    "/api/deals/:dealId",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      const deal = await updateDeal(req.params.dealId, req.body, user.email);
      res.status(200).json(deal);
    })
  );

  router.get(
    "/api/deals/:dealId",
    asyncHandler(async (req, res) => {
      const deal = await getDeal(req.params.dealId);
      if (!deal) {
        res.status(404).json({ message: "Deal not found" });
        return;
      }

      res.status(200).json(deal);
    })
  );

  router.get(
    "/api/deals",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const deals = await getDealList(user.email, status);
      res.status(200).json({ records: deals });
    })
  );

  router.post(
    "/api/deals/:dealId/lines",
    asyncHandler(async (req, res) => {
      const line = await addDealLine(req.params.dealId, req.body);
      res.status(201).json(line);
    })
  );

  router.put(
    "/api/deals/:dealId/lines/:lineId",
    asyncHandler(async (req, res) => {
      const line = await updateDealLine(req.params.dealId, req.params.lineId, req.body);
      if (!line) {
        res.status(404).json({ message: "Line item not found" });
        return;
      }

      res.status(200).json(line);
    })
  );

  router.delete(
    "/api/deals/:dealId/lines/:lineId",
    asyncHandler(async (req, res) => {
      const deleted = await removeDealLine(req.params.dealId, req.params.lineId);
      res.status(deleted ? 204 : 404).send();
    })
  );

  router.post(
    "/api/deals/:dealId/submit",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      const result = await submitDeal(req.params.dealId, user.email);
      const statusCode = result.success ? 200 : result.status === "validation_failed" ? 400 : 502;
      res.status(statusCode).json(result);
    })
  );

  router.get(
    "/api/deals/:dealId/status",
    asyncHandler(async (req, res) => {
      const status = await getDealStatus(req.params.dealId);
      if (!status) {
        res.status(404).json({ message: "Deal not found" });
        return;
      }

      res.status(200).json(status);
    })
  );

  router.get(
    "/api/submissions",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      const records = await listSubmissions(user.email);
      res.status(200).json({ records });
    })
  );

  router.post(
    "/api/submissions/:submissionId/retry",
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }

      await retrySubmission(req.params.submissionId, 1, user.email);
      const submission = await getSubmission(req.params.submissionId);
      res.status(200).json({ success: true, submission });
    })
  );

  return router;
}