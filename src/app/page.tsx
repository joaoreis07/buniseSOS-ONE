import type { Metadata } from "next";
import { LandingPage } from "@/modules/marketing/components/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "BusinessOS One — Gestão completa para sua empresa",
  },
  description:
    "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar com o BusinessOS One.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "BusinessOS One — Gestão completa para sua empresa",
    description:
      "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar com o BusinessOS One.",
  },
};

export default function Home() {
  return <LandingPage />;
}
