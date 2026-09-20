import type { Metadata } from "next";
import { LandingPage } from "@/modules/marketing/components/landing-page";

export const metadata: Metadata = {
  title: "Sobre o produto",
  description:
    "CRM, vendas, estoque, financeiro, compras e relatórios no BusinessOS One. Plano único de R$ 197/mês.",
  alternates: {
    canonical: "/sobre",
  },
};

export default function SobrePage() {
  return <LandingPage />;
}
