// app/api/digitax/register-item/route.ts
// POST: Ensures the "Parking Fee" item exists in DigiTax and returns its ID.
// Safe to call multiple times — never creates duplicates.

import { NextResponse } from "next/server";
import { ensureParkingFeeItem, findExistingParkingFeeItem } from "@/lib/digitax";

export async function POST() {
  try {
    if (!process.env.DIGITAX_API_KEY) {
      return NextResponse.json(
        { error: "DIGITAX_API_KEY is not configured. Add it to your .env.local file." },
        { status: 503 }
      );
    }

    const itemId = await ensureParkingFeeItem();
    return NextResponse.json({ success: true, item_id: itemId });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: unknown; raw?: unknown };
    console.error("[DigiTax] register-item error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to register DigiTax item", detail: e?.raw },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!process.env.DIGITAX_API_KEY) {
      return NextResponse.json(
        { error: "DIGITAX_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const savedId = process.env.DIGITAX_ITEM_ID || null;
    const foundId = savedId || (await findExistingParkingFeeItem());
    return NextResponse.json({ item_id: foundId, source: savedId ? "env" : "api" });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message || "Failed to look up item" }, { status: 500 });
  }
}

