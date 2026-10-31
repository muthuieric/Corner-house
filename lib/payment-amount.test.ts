import { describe, expect, it } from "vitest";
import {
  calculatePaymentTotal,
  SERVICE_CHARGE_BOB,
  type PaymentBreakdown,
} from "./payment-amount";

describe("SERVICE_CHARGE_BOB", () => {
  it("is a flat 10 bob charge", () => {
    expect(SERVICE_CHARGE_BOB).toBe(10);
  });
});

describe("calculatePaymentTotal", () => {
  it("adds 10 bob to 100 -> 110", () => {
    const result: PaymentBreakdown = calculatePaymentTotal(100);
    expect(result).toEqual({
      subtotal: 100,
      serviceCharge: 10,
      total: 110,
      currency: "KES",
    });
  });

  it("returns the exact rule the guest described", () => {
    // "if she should pay 100 its 110 for add 10 bob"
    expect(calculatePaymentTotal(100).total).toBe(110);
    expect(calculatePaymentTotal(100).serviceCharge).toBe(10);
  });

  it("works for other bill amounts (e.g. 500 -> 510)", () => {
    expect(calculatePaymentTotal(500).total).toBe(510);
    expect(calculatePaymentTotal(500).serviceCharge).toBe(10);
  });

  it("works for small bills (1 -> 11)", () => {
    expect(calculatePaymentTotal(1).total).toBe(11);
  });

  it("does not add a service charge when the bill is zero", () => {
    expect(calculatePaymentTotal(0)).toEqual({
      subtotal: 0,
      serviceCharge: 0,
      total: 0,
      currency: "KES",
    });
  });

  it("clamps a negative bill to 0 (no negative totals)", () => {
    expect(calculatePaymentTotal(-50).total).toBe(0);
    expect(calculatePaymentTotal(-50).serviceCharge).toBe(0);
  });

  it("treats non-numeric input as 0", () => {
    expect(calculatePaymentTotal("not-a-number").total).toBe(0);
  });

  it("accepts and coerces a string amount", () => {
    expect(calculatePaymentTotal("250").total).toBe(260);
  });

  it("rejects invalid currency mixing", () => {
    expect(calculatePaymentTotal(100).currency).toBe("KES");
  });
});
