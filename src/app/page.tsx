import type { Metadata } from "next";
import { LandingPage } from "@/modules/marketing/components/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "BusinessOS One — Gestão completa para sua empresa",
  },
  description:
    "CRM, vendas, estoque, financeiro, compras e relatórios no BusinessOS One. Plano único de R$ 197/mês.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "BusinessOS One — Gestão completa para sua empresa",
    description:
      "CRM, vendas, estoque, financeiro, compras e relatórios no BusinessOS One. Plano único de R$ 197/mês.",
  },
};

export default function Home() {
  return <LandingPage />;
}
