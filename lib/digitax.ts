export async function ensureParkingFeeItem(): Promise<string> {
  return process.env.DIGITAX_ITEM_ID || "item_01M6MDA9VP6ZGNMBZPQM5020F9";
}
export async function findExistingParkingFeeItem(): Promise<string | null> {
  return process.env.DIGITAX_ITEM_ID || null;
}
export interface DigitaxSaleResponse {
  id: string;
  invoice_number: number;
  etims_url?: string;
  offline_url?: string;
  status: string;
}

export async function submitParkingSale(params: {
  sessionId: string;
  amount: number;
  saleDate?: string;
}): Promise<DigitaxSaleResponse | null> {
  const apiKey = process.env.DIGITAX_API_KEY;
  const itemId = process.env.DIGITAX_ITEM_ID || "item_01M6MDA9VP6ZGNMBZPQM5020F9";
  const isEnabled = process.env.DIGITAX_PRODUCTION_ENABLED === "true";

  if (!isEnabled) {
    return {
      id: `mock-${params.sessionId}`,
      invoice_number: 999999,
      status: "MOCK_SUCCESS",
    };
  }

  const payload = {
    sale_date: params.saleDate || new Date().toISOString().split("T")[0],
    trader_invoice_number: `PARK-${params.sessionId}`,
    payment_type_code: "04",
    invoice_status_code: "01",
    is_tax_exempt: false,
    items: [
      {
        id: itemId,
        quantity: 1,
        unit_price: params.amount,
        total_amount: params.amount,
        package_unit_quantity: 1,
      },
    ],
  };

  try {
    const response = await fetch("https://api.digitax.tech/ke/v2/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-API-Key": apiKey || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[DigiTax Error]", data);
      throw new Error(data.message || "Failed to submit DigiTax sale");
    }

    return data;
  } catch (error) {
    console.error("[DigiTax Exception]", error);
    return null;
  }
}

export async function getSaleStatus(id: string): Promise<DigitaxSaleResponse | null> { return null; }
