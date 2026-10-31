import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/pg-client";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate");
  if (!plate) return NextResponse.json({ error: "plate required" }, { status: 400 });
  const cleanPlate = plate.trim().toUpperCase();

  // Find the most recent active or paid session for this vehicle
  const result = await executeQuery(
    `SELECT * FROM public.parking_sessions 
     WHERE plate_number = $1 
       AND status IN ('ACTIVE', 'PAID') 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [cleanPlate]
  );

  let s;
  if (result.rows.length === 0) {
    // If no session exists at all, auto-create a new active one
    const insertRes = await executeQuery(
      `INSERT INTO public.parking_sessions (plate_number, status) 
       VALUES ($1, 'ACTIVE') 
       RETURNING *`,
      [cleanPlate]
    );
    s = insertRes.rows[0];
  } else {
    s = result.rows[0];
  }

  const entryTime = new Date(s.entry_time || s.created_at);
  const now = new Date();
  const durationMinutes = Math.max(1, Math.ceil((now.getTime() - entryTime.getTime()) / (1000 * 60)));
  const BASE_CHARGE = 10;
  const SERVICE_FEE = 5;
  const amountDue = BASE_CHARGE + SERVICE_FEE;

  return NextResponse.json({
    sessionId: s.id,
    plateNumber: s.plate_number,
    entryTime: s.entry_time,
    durationMinutes,
    baseAmount: BASE_CHARGE,
    extraAmount: 0,
    serviceFee: SERVICE_FEE,
    amountDue,
    amountPaid: Number(s.amount_paid || 0),
    paidAt: s.paid_at || null,
    mpesaReceipt: s.mpesa_receipt_number || null,
    status: s.status,
  });
}
