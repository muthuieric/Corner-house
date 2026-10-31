import type { ReactNode } from "react";
import PaymentQrForm from "@/components/payment/PaymentQrForm";

export const metadata = {
  title: "Corner House · Pay a bill",
  description: "Enter the amount a guest should pay and generate a QR code. 10 bob is added automatically.",
};

export default function PayPage(): ReactNode {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-14">
      <PaymentQrForm />
    </main>
  );
}
