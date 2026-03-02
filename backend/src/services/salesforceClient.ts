import jwt from "jsonwebtoken";
import { Connection } from "jsforce";
import { env } from "../config/env";

interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export class SalesforceClient {
  private connection: Connection | null = null;
  private tokenExpiresAt = 0;
  private authPromise: Promise<void> | null = null;

  private canAuthenticate(): boolean {
    return Boolean(env.SF_CLIENT_ID && env.SF_USERNAME && env.SF_PRIVATE_KEY);
  }

  public isConfigured(): boolean {
    return this.canAuthenticate();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.canAuthenticate()) {
      throw new Error("Salesforce credentials are not configured. Set SF_CLIENT_ID, SF_USERNAME, SF_PRIVATE_KEY.");
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

  private async authenticate(): Promise<void> {
    const assertion = jwt.sign(
      {
        iss: env.SF_CLIENT_ID,
        sub: env.SF_USERNAME,
        aud: env.SF_LOGIN_URL
      },
      env.SF_PRIVATE_KEY!,
      { algorithm: "RS256", expiresIn: "3m" }
    );

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    });

    const response = await fetch(`${env.SF_LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Salesforce auth failed: ${response.status} ${message}`);
    }

    const token = (await response.json()) as SalesforceTokenResponse;

    this.connection = new Connection({
      instanceUrl: token.instance_url,
      accessToken: token.access_token,
      version: env.SF_API_VERSION
    });

    this.tokenExpiresAt = Date.now() + 8 * 60 * 1000;
  }

  private async getConnection(): Promise<Connection> {
    await this.ensureAuthenticated();
    if (!this.connection) {
      throw new Error("Salesforce connection is unavailable.");
    }

    return this.connection;
  }

  public async queryAll<T>(soql: string): Promise<T[]> {
    const conn = await this.getConnection();
    const encoded = encodeURIComponent(soql);
    let path = `/services/data/v${env.SF_API_VERSION}/query?q=${encoded}`;
    const records: T[] = [];

    while (path) {
      const result = (await conn.requestGet(path)) as {
        records: T[];
        done: boolean;
        nextRecordsUrl?: string;
      };

      records.push(...result.records);
      path = result.done ? "" : result.nextRecordsUrl ?? "";
    }

    return records;
  }

  public async describe(objectApiName: string): Promise<unknown> {
    const conn = await this.getConnection();
    return conn.requestGet(`/services/data/v${env.SF_API_VERSION}/sobjects/${objectApiName}/describe`);
  }

  public async composite<T>(payload: unknown): Promise<T> {
    const conn = await this.getConnection();
    return conn.requestPost(
      `/services/data/v${env.SF_API_VERSION}/composite`,
      payload as Record<string, unknown>
    ) as Promise<T>;
  }

  public async getRecord<T>(objectApiName: string, recordId: string, fields: string[]): Promise<T> {
    const conn = await this.getConnection();
    const fieldList = fields.join(",");
    return conn.requestGet(
      `/services/data/v${env.SF_API_VERSION}/sobjects/${objectApiName}/${recordId}?fields=${encodeURIComponent(fieldList)}`
    ) as Promise<T>;
  }

  public async querySingle<T>(soql: string): Promise<T | null> {
    const records = await this.queryAll<T>(soql);
    return records.length > 0 ? records[0] : null;
  }
}

export const salesforceClient = new SalesforceClient();
