import type { Metadata } from "next";
import { DemoShell } from "@/modules/marketing/components/demo-shell";

export const metadata: Metadata = {
  title: {
    absolute: "BusinessOS One — Gestão completa para sua empresa",
  },
  description:
    "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "BusinessOS One — Gestão completa para sua empresa",
    description:
      "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar.",
  },
};

export default function Home() {
  return <DemoShell module="dashboard" />;
}
