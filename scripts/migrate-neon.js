const fs = require("fs");
const { Client } = require("pg");

const text = fs.readFileSync(".env.local", "utf8");
let dbUrl = "";
for (const line of text.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
  }
}

if (!dbUrl) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

const migrationSql = `
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Parking sessions table
CREATE TABLE IF NOT EXISTS public.parking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(20) NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  amount_due NUMERIC(10, 2) DEFAULT 0.00,
  payhero_ref VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_active
ON public.parking_sessions(plate_number, status);

-- 1. Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  plan_tier TEXT DEFAULT 'basic',
  pending_plan_tier TEXT,
  pending_plan_effective_at TIMESTAMPTZ,
  plan_change_effective_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'active',
  subscription_ends_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  current_balance NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  hard_locked BOOLEAN DEFAULT FALSE,
  custom_fields JSONB DEFAULT '[]'::jsonb
);

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'company_admin',
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Hosts table
CREATE TABLE IF NOT EXISTS public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'checked_in',
  expected_arrival TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  provider TEXT DEFAULT 'payhero',
  provider_reference TEXT,
  checkout_request_id TEXT,
  external_reference TEXT,
  tracking_id TEXT,
  phone_number TEXT,
  mpesa_receipt_number TEXT,
  status TEXT DEFAULT 'pending',
  raw_callback_payload JSONB,
  raw_initiate_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  billing_period_key TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  plan_name TEXT,
  base_price NUMERIC,
  included_visitors INTEGER,
  extra_visitor_rate NUMERIC,
  visitor_count INTEGER,
  extra_visitors INTEGER,
  extra_visitor_charges NUMERIC,
  total_amount NUMERIC,
  current_balance NUMERIC
);

CREATE UNIQUE INDEX IF NOT EXISTS transactions_provider_reference_unique
  ON public.transactions(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_checkout_request_id_unique
  ON public.transactions(checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_billing_period
  ON public.transactions(company_id, billing_period_key);

CREATE INDEX IF NOT EXISTS idx_transactions_provider_status
  ON public.transactions(provider, status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions(created_at DESC);

-- 6. Billing Usage table
CREATE TABLE IF NOT EXISTS public.billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  visitor_count INTEGER DEFAULT 0,
  included_visitors INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT billing_usage_company_month_unique UNIQUE (company_id, billing_month)
);

CREATE INDEX IF NOT EXISTS idx_billing_usage_company_month
  ON public.billing_usage(company_id, billing_month);
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to Neon PostgreSQL database...");
    await client.query(migrationSql);
    console.log("Migration executed successfully!");
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
    console.log("Neon Tables:", res.rows.map(r => r.table_name));
    await client.end();
  } catch (err) {
    console.error("Migration error:", err);
    await client.end();
    process.exit(1);
  }
}

run();

