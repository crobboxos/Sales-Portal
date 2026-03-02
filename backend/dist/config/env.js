"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
  PORT: zod_1.z.coerce.number().default(8080),
  NODE_ENV: zod_1.z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: zod_1.z.string().min(1),
  JWT_SECRET: zod_1.z.string().min(16),
  AUTH_BYPASS: zod_1.z
    .string()
    .optional()
    .transform((value) => value === "true"),
  DEFAULT_USER_EMAIL: zod_1.z
    .string()
    .email()
    .default("portal.user@xeretec.co.uk"),
  SF_LOGIN_URL: zod_1.z.string().url().default("https://test.salesforce.com"),
  SF_API_VERSION: zod_1.z.string().default("66.0"),
  SF_CLIENT_ID: zod_1.z.string().optional(),
  SF_USERNAME: zod_1.z.string().optional(),
  SF_PRIVATE_KEY: zod_1.z.string().optional(),
  SF_DEFAULT_RECORD_TYPE_ID: zod_1.z.string().default("0124K000000Mg7TQAS"),
  SF_DEFAULT_PRICEBOOK_ID: zod_1.z.string().default("01s4K000005dhNAQAY"),
  SF_DEFAULT_COMPANY_ERP_ID: zod_1.z.string().default("a0C4K000003ToYHUA0"),
  SF_DEFAULT_SO_TYPE: zod_1.z.string().default("Drop Ship Item"),
  SF_DELIVERY_PRODUCT_CODE_SOFTWARE_LICENSING: zod_1.z
    .string()
    .default("DEL - S/W LIC"),
  RETRY_DELAYS_SECONDS: zod_1.z.string().default("60,300,900,1800,3600"),
  QUEUE_CONCURRENCY: zod_1.z.coerce.number().default(5)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(formatted)}`
  );
}
const retryDelays = parsed.data.RETRY_DELAYS_SECONDS.split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
if (retryDelays.length === 0) {
  throw new Error(
    "RETRY_DELAYS_SECONDS must contain at least one positive integer."
  );
}
const privateKey = parsed.data.SF_PRIVATE_KEY
  ? parsed.data.SF_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;
exports.env = {
  ...parsed.data,
  AUTH_BYPASS: parsed.data.AUTH_BYPASS ?? false,
  SF_PRIVATE_KEY: privateKey,
  RETRY_DELAYS_SECONDS_PARSED: retryDelays
};
