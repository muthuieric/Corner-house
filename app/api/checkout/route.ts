import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/billing/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireUuid } from "@/lib/validation";

type CheckoutPayload = {
  companyId?: string;
  code?: string;
  otp?: string;
};

function normalizeVisitorCode(value: unknown) {
  const code = String(value || "").trim();
  if (!/^\d{4,6}$/.test(code)) {
    throw Object.assign(new Error("Enter a valid visitor code."), { status: 400 });
  }
  return code;
}

function safeError(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 500;
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  return {
    status: safeStatus,
    message: safeStatus >= 500 ? "Visitor could not be checked out." : error instanceof Error ? error.message : "Visitor could not be checked out.",
  };
}

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { keyPrefix: "visitor-checkout", limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const payload = (await request.json()) as CheckoutPayload;
    const companyId = requireUuid(payload.companyId, "companyId");
    const code = normalizeVisitorCode(payload.code || payload.otp);
    const supabaseAdmin = createSupabaseAdmin();

    const { data: visitors, error: visitorError } = await supabaseAdmin
      .from("visitors")
      .select("id, company_id, name, host_name, status, checked_out_at, pass_expired_at, pass_code, otp_code")
      .eq("company_id", companyId)
      .or(`pass_code.eq.${code},otp_code.eq.${code}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (visitorError) throw visitorError;

    const visitor = visitors?.[0];
    if (!visitor) {
      return NextResponse.json({ error: "No active visitor found with this code." }, { status: 404 });
    }

    if (visitor.status === "pending") {
      return NextResponse.json({ error: "This visitor has not been approved by security yet." }, { status: 409 });
    }

    if (visitor.status === "checked_out" || visitor.status === "auto_checked_out" || visitor.checked_out_at) {
      return NextResponse.json({ error: "No active visitor found with this code." }, { status: 409 });
    }

    if (visitor.pass_expired_at) {
      return NextResponse.json({ error: "No active visitor found with this code." }, { status: 409 });
    }

    if (visitor.status !== "checked_in") {
      return NextResponse.json({ error: "No active visitor found with this code." }, { status: 409 });
    }

    const checkedOutAt = new Date().toISOString();
    const { data: updatedVisitor, error: updateError } = await supabaseAdmin
      .from("visitors")
      .update({
        status: "checked_out",
        checked_out_at: checkedOutAt,
        pass_expired_at: checkedOutAt,
        otp_code: null,
      })
      .eq("id", visitor.id)
      .eq("company_id", companyId)
      .eq("status", "checked_in")
      .is("checked_out_at", null)
      .is("pass_expired_at", null)
      .select("name, host_name, checked_out_at")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Visitor checked out successfully.",
      visitor: {
        name: updatedVisitor.name,
        hostName: updatedVisitor.host_name || null,
        checkedOutAt: updatedVisitor.checked_out_at,
      },
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    const response = safeError(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
