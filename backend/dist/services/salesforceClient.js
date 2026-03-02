"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesforceClient = exports.SalesforceClient = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jsforce_1 = require("jsforce");
const env_1 = require("../config/env");
class SalesforceClient {
  connection = null;
  tokenExpiresAt = 0;
  authPromise = null;
  canAuthenticate() {
    return Boolean(
      env_1.env.SF_CLIENT_ID &&
      env_1.env.SF_USERNAME &&
      env_1.env.SF_PRIVATE_KEY
    );
  }
  isConfigured() {
    return this.canAuthenticate();
  }
  async ensureAuthenticated() {
    if (!this.canAuthenticate()) {
      throw new Error(
        "Salesforce credentials are not configured. Set SF_CLIENT_ID, SF_USERNAME, SF_PRIVATE_KEY."
      );
    }
    const now = Date.now();
    if (this.connection && now < this.tokenExpiresAt - 60_000) {
      return;
    }
    if (!this.authPromise) {
      this.authPromise = this.authenticate().finally(() => {
        this.authPromise = null;
      });
    }
    await this.authPromise;
  }
  async authenticate() {
    const assertion = jsonwebtoken_1.default.sign(
      {
        iss: env_1.env.SF_CLIENT_ID,
        sub: env_1.env.SF_USERNAME,
        aud: env_1.env.SF_LOGIN_URL
      },
      env_1.env.SF_PRIVATE_KEY,
      { algorithm: "RS256", expiresIn: "3m" }
    );
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    });
    const response = await fetch(
      `${env_1.env.SF_LOGIN_URL}/services/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Salesforce auth failed: ${response.status} ${message}`);
    }
    const token = await response.json();
    this.connection = new jsforce_1.Connection({
      instanceUrl: token.instance_url,
      accessToken: token.access_token,
      version: env_1.env.SF_API_VERSION
    });
    this.tokenExpiresAt = Date.now() + 8 * 60 * 1000;
  }
  async getConnection() {
    await this.ensureAuthenticated();
    if (!this.connection) {
      throw new Error("Salesforce connection is unavailable.");
    }
    return this.connection;
  }
  async queryAll(soql) {
    const conn = await this.getConnection();
    const encoded = encodeURIComponent(soql);
    let path = `/services/data/v${env_1.env.SF_API_VERSION}/query?q=${encoded}`;
    const records = [];
    while (path) {
      const result = await conn.requestGet(path);
      records.push(...result.records);
      path = result.done ? "" : (result.nextRecordsUrl ?? "");
    }
    return records;
  }
  async describe(objectApiName) {
    const conn = await this.getConnection();
    return conn.requestGet(
      `/services/data/v${env_1.env.SF_API_VERSION}/sobjects/${objectApiName}/describe`
    );
  }
  async composite(payload) {
    const conn = await this.getConnection();
    return conn.requestPost(
      `/services/data/v${env_1.env.SF_API_VERSION}/composite`,
      payload
    );
  }
  async getRecord(objectApiName, recordId, fields) {
    const conn = await this.getConnection();
    const fieldList = fields.join(",");
    return conn.requestGet(
      `/services/data/v${env_1.env.SF_API_VERSION}/sobjects/${objectApiName}/${recordId}?fields=${encodeURIComponent(fieldList)}`
    );
  }
  async querySingle(soql) {
    const records = await this.queryAll(soql);
    return records.length > 0 ? records[0] : null;
  }
}
exports.SalesforceClient = SalesforceClient;
exports.salesforceClient = new SalesforceClient();
