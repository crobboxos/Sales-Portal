"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRouter = buildRouter;
const express_1 = require("express");
const routes_1 = require("../auth/routes");
const pool_1 = require("../db/pool");
const asyncHandler_1 = require("./asyncHandler");
const middleware_1 = require("../auth/middleware");
const referenceSyncService_1 = require("../services/referenceSyncService");
const dealService_1 = require("../services/dealService");
const dealSubmissionService_1 = require("../services/dealSubmissionService");
const referenceRepository_1 = require("../repositories/referenceRepository");
const submissionRepository_1 = require("../repositories/submissionRepository");
function buildRouter() {
  const router = (0, express_1.Router)();
  router.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  router.post(
    "/api/auth/login",
    (0, asyncHandler_1.asyncHandler)(routes_1.loginHandler)
  );
  router.use("/api", middleware_1.authMiddleware);
  router.get(
    "/api/accounts",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const search = typeof req.query.q === "string" ? req.query.q : undefined;
      const accounts = await (0, referenceRepository_1.findAccounts)(search);
      res.status(200).json({ records: accounts });
    })
  );
  router.get(
    "/api/products",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const lob = typeof req.query.lob === "string" ? req.query.lob : undefined;
      const currency =
        typeof req.query.currency === "string" ? req.query.currency : undefined;
      const products = await (0, referenceRepository_1.findProducts)(
        lob,
        currency
      );
      res.status(200).json({ records: products });
    })
  );
  router.get(
    "/api/pricebooks",
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
      const result = await (0, pool_1.query)(`
        SELECT DISTINCT
          sf_pricebook2_id AS "sfPricebook2Id",
          pricebook_name AS "pricebookName"
        FROM pricebook_entry_ref
        ORDER BY pricebook_name ASC;
      `);
      res.status(200).json({ records: result.rows });
    })
  );
  router.get(
    "/api/picklists/:objectApiName/:fieldApiName",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const { objectApiName, fieldApiName } = req.params;
      const values = await (0, referenceRepository_1.getPicklistValues)(
        objectApiName,
        fieldApiName
      );
      res.status(200).json({ records: values });
    })
  );
  router.post(
    "/api/sync/reference-data",
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
      const result = await (0, referenceSyncService_1.runReferenceDataSync)();
      res.status(200).json({ success: true, ...result });
    })
  );
  router.post(
    "/api/deals",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      const deal = await (0, dealService_1.createDeal)(req.body, user.email);
      res.status(201).json(deal);
    })
  );
  router.put(
    "/api/deals/:dealId",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      const deal = await (0, dealService_1.updateDeal)(
        req.params.dealId,
        req.body,
        user.email
      );
      res.status(200).json(deal);
    })
  );
  router.get(
    "/api/deals/:dealId",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const deal = await (0, dealService_1.getDeal)(req.params.dealId);
      if (!deal) {
        res.status(404).json({ message: "Deal not found" });
        return;
      }
      res.status(200).json(deal);
    })
  );
  router.get(
    "/api/deals",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const deals = await (0, dealService_1.getDealList)(user.email, status);
      res.status(200).json({ records: deals });
    })
  );
  router.post(
    "/api/deals/:dealId/lines",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const line = await (0, dealService_1.addDealLine)(
        req.params.dealId,
        req.body
      );
      res.status(201).json(line);
    })
  );
  router.put(
    "/api/deals/:dealId/lines/:lineId",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const line = await (0, dealService_1.updateDealLine)(
        req.params.dealId,
        req.params.lineId,
        req.body
      );
      if (!line) {
        res.status(404).json({ message: "Line item not found" });
        return;
      }
      res.status(200).json(line);
    })
  );
  router.delete(
    "/api/deals/:dealId/lines/:lineId",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const deleted = await (0, dealService_1.removeDealLine)(
        req.params.dealId,
        req.params.lineId
      );
      res.status(deleted ? 204 : 404).send();
    })
  );
  router.post(
    "/api/deals/:dealId/submit",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      const result = await (0, dealSubmissionService_1.submitDeal)(
        req.params.dealId,
        user.email
      );
      const statusCode = result.success
        ? 200
        : result.status === "validation_failed"
          ? 400
          : 502;
      res.status(statusCode).json(result);
    })
  );
  router.get(
    "/api/deals/:dealId/status",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const status = await (0, dealService_1.getDealStatus)(req.params.dealId);
      if (!status) {
        res.status(404).json({ message: "Deal not found" });
        return;
      }
      res.status(200).json(status);
    })
  );
  router.get(
    "/api/submissions",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      const records = await (0, submissionRepository_1.listSubmissions)(
        user.email
      );
      res.status(200).json({ records });
    })
  );
  router.post(
    "/api/submissions/:submissionId/retry",
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "User context is missing." });
        return;
      }
      await (0, dealSubmissionService_1.retrySubmission)(
        req.params.submissionId,
        1,
        user.email
      );
      const submission = await (0, dealService_1.getSubmission)(
        req.params.submissionId
      );
      res.status(200).json({ success: true, submission });
    })
  );
  return router;
}
