import type { Metadata } from "next";
import { DemoTour } from "@/modules/marketing/components/demo-tour";

export const metadata: Metadata = {
  title: "Demonstração",
  description:
    "Conheça o BusinessOS One com telas de exemplo: CRM, vendas, estoque, financeiro, compras e relatórios. Sem login e sem dados de produção.",
  alternates: {
    canonical: "/demonstracao",
  },
  openGraph: {
    url: "/demonstracao",
    title: "Demonstração — BusinessOS One",
    description:
      "Tour público do BusinessOS One com dados de exemplo. Nada aqui altera o banco de produção.",
  },
};

export default function DemonstracaoPage() {
  return <DemoTour />;
}
