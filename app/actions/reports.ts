"use server";

export async function getDigitaxSalesSummary(startDate: string, endDate: string) {
  const apiKey = process.env.DIGITAX_API_KEY;
  try {
    const res = await fetch(
      `https://api.digitax.tech/ke/v2/sales-summary?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey || "",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch summary");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
