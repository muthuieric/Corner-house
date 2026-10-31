import "server-only";

import type { createSupabaseAdmin } from "@/lib/billing/server";
import { BASIC_INCLUDED_VISITORS } from "@/lib/billing/pricing";

function getUtcBillingMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function incrementBillingUsage(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  companyId: string,
  date = new Date()
) {
  const billingMonth = getUtcBillingMonth(date);

  const { data: existing, error: readError } = await supabaseAdmin
    .from("billing_usage")
    .select("visitor_count")
    .eq("company_id", companyId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  if (readError) throw readError;

  const visitorCount = Number(existing?.visitor_count || 0) + 1;
  const { error } = await supabaseAdmin.from("billing_usage").upsert(
    {
      company_id: companyId,
      billing_month: billingMonth,
      visitor_count: visitorCount,
      included_visitors: BASIC_INCLUDED_VISITORS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,billing_month" }
  );

  if (error) throw error;
}
