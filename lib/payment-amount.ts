/**
 * Corner House payment-amount logic.
 *
 * Rule (as requested): "if she should pay 100, it's 110 — add 10 bob".
 * A guest enters the amount they *should* pay (the bill). The system then adds a
 * flat 10 bob service charge (KES 10), so the QR encodes the amount the guest
 * actually pays.
 *
 * Example: 100 -> subtotal 100, service charge 10 bob, total 110.
 */

/** Flat service charge added to every bill, in Kenyan Shillings (bob). */
export const SERVICE_CHARGE_BOB = 10;

export type PaymentBreakdown = {
  /** The amount the guest should pay before the service charge. */
  subtotal: number;
  /** The "10 bob" service charge added. */
  serviceCharge: number;
  /** The final amount the guest pays (subtotal + service charge). */
  total: number;
  currency: "KES";
};

/**
 * Round a value to a whole Kenyan Shilling and guard against non-numbers.
 * Partial cents are not used (M-Pesa STK requires a whole-amount number).
 */
function toWholeShillings(value: number | string | undefined | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
}

/**
 * Compute the payment breakdown for a guest bill.
 * If the bill is greater than 0, a flat `SERVICE_CHARGE_BOB` (10 bob) is added.
 */
export function calculatePaymentTotal(amount: number | string): PaymentBreakdown {
  const subtotal = toWholeShillings(amount);
  const serviceCharge = subtotal > 0 ? SERVICE_CHARGE_BOB : 0;
  const total = subtotal + serviceCharge;
  return { subtotal, serviceCharge, total, currency: "KES" };
}
