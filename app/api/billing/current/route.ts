import { NextResponse } from "next/server";
import { getCurrentBillingSummary } from "@/lib/billing/server";
import { assertCompanyAccess, getSafeErrorResponse, requireRole } from "@/lib/api-auth";
import { requireUuid } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = requireUuid(searchParams.get("companyId"), "companyId");
    const { profile } = await requireRole(req, ["company_admin", "superadmin"]);
    assertCompanyAccess(profile, companyId);

    const summary = await getCurrentBillingSummary(companyId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Billing summary error:", error);
    const safeError = getSafeErrorResponse(error, "Billing summary could not be loaded.");
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
