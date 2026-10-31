alter table public.companies
  add column if not exists current_balance numeric default 0;

alter table public.transactions
  add column if not exists currency text default 'KES',
  add column if not exists provider text default 'legacy',
  add column if not exists provider_reference text,
  add column if not exists checkout_request_id text,
  add column if not exists external_reference text,
  add column if not exists phone_number text,
  add column if not exists mpesa_receipt_number text,
  add column if not exists raw_callback_payload jsonb,
  add column if not exists raw_initiate_response jsonb,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists paid_at timestamptz,
  add column if not exists reversed_at timestamptz,
  add column if not exists billing_period_key text,
  add column if not exists billing_period_start timestamptz,
  add column if not exists billing_period_end timestamptz,
  add column if not exists plan_name text,
  add column if not exists base_price numeric,
  add column if not exists included_visitors integer,
  add column if not exists extra_visitor_rate numeric,
  add column if not exists visitor_count integer,
  add column if not exists extra_visitors integer,
  add column if not exists extra_visitor_charges numeric,
  add column if not exists total_amount numeric,
  add column if not exists current_balance numeric;

update public.transactions
set
  currency = coalesce(currency, 'KES'),
  provider = coalesce(provider, 'legacy'),
  provider_reference = coalesce(provider_reference, tracking_id),
  paid_at = case
    when paid_at is null and lower(coalesce(status, '')) in ('completed', 'success', 'paid') then created_at
    else paid_at
  end
where currency is null
   or provider is null
   or provider_reference is null
   or paid_at is null;

create unique index if not exists transactions_provider_reference_unique
  on public.transactions(provider, provider_reference)
  where provider_reference is not null;

create unique index if not exists transactions_checkout_request_id_unique
  on public.transactions(checkout_request_id)
  where checkout_request_id is not null;

create index if not exists idx_transactions_billing_period
  on public.transactions(company_id, billing_period_key);

create index if not exists idx_transactions_provider_status
  on public.transactions(provider, status);
