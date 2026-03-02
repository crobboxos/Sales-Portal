CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS account_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sf_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_number TEXT,
  billing_city TEXT,
  billing_postal_code TEXT,
  record_type_name TEXT,
  scmc_active BOOLEAN,
  scmc_customer BOOLEAN,
  scmc_email TEXT,
  raw_payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sf_product2_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  product_sub_type TEXT,
  line_of_business TEXT,
  product_category TEXT,
  raw_payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricebook_entry_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sf_pricebook_entry_id TEXT NOT NULL UNIQUE,
  sf_pricebook2_id TEXT NOT NULL,
  pricebook_name TEXT,
  sf_product2_id TEXT NOT NULL,
  product_code TEXT,
  unit_price NUMERIC(18, 4) NOT NULL,
  currency_iso_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  raw_payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS picklist_values (
  object_api_name TEXT NOT NULL,
  field_api_name TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  is_default BOOLEAN NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (object_api_name, field_api_name, value)
);

CREATE TABLE IF NOT EXISTS deal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_deal_id UUID NOT NULL UNIQUE,
  sf_opportunity_id TEXT,
  sf_opportunity_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  account_id TEXT NOT NULL,
  stage_name TEXT NOT NULL DEFAULT 'Open',
  close_date DATE NOT NULL,
  lines_of_business TEXT NOT NULL DEFAULT 'Software Licensing',
  funding_type TEXT NOT NULL,
  currency_iso_code TEXT NOT NULL DEFAULT 'GBP',
  record_type_id TEXT NOT NULL,
  pricebook2_id TEXT NOT NULL,
  company_erp_id TEXT NOT NULL,
  estimated_costs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  estimated_revenue NUMERIC(18, 2) NOT NULL DEFAULT 0,
  notifiy TEXT NOT NULL DEFAULT 'No requirement',
  iwm_sales_order_req BOOLEAN NOT NULL DEFAULT FALSE,
  iwm_sales_order_type TEXT NOT NULL,
  deliver_to_id TEXT,
  customer_purchase_order TEXT,
  owner_id TEXT,
  link_opp2so_state TEXT,
  link_opp2so_id TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_line_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  portal_line_id UUID NOT NULL UNIQUE,
  sf_oli_id TEXT,
  product2_id TEXT NOT NULL,
  pricebook_entry_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(18, 4) NOT NULL,
  discount NUMERIC(6, 3),
  service_date DATE,
  sort_order INTEGER,
  product_condition TEXT NOT NULL,
  sales_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
  contract_type_software TEXT,
  subscription_start_date DATE,
  subscription_term_months INTEGER,
  subscription_billing_commitment TEXT,
  subscription_billing_plan TEXT,
  is_delivery_line BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  sf_opportunity_id TEXT,
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_detail JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_http_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  object_type TEXT NOT NULL,
  sf_record_id TEXT,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload_diff JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_status ON deal(status);
CREATE INDEX IF NOT EXISTS idx_deal_created_by ON deal(created_by);
CREATE INDEX IF NOT EXISTS idx_submission_status ON submission(status);
CREATE INDEX IF NOT EXISTS idx_submission_deal_id ON submission(deal_id);
CREATE INDEX IF NOT EXISTS idx_sync_job_status ON sync_job(status);
CREATE INDEX IF NOT EXISTS idx_picklist_values_lookup ON picklist_values(object_api_name, field_api_name);
CREATE INDEX IF NOT EXISTS idx_pricebook_entry_lookup ON pricebook_entry_ref(sf_pricebook2_id, currency_iso_code, sf_product2_id);