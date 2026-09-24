import type { Metadata } from "next";
import { DemoRootShell } from "@/modules/marketing/components/demo-root-shell";

export const metadata: Metadata = {
  title: "Demonstração — BusinessOS One",
  description:
    "Explore clientes, vendas, estoque, financeiro e compras com dados fictícios.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoRootShell>{children}</DemoRootShell>;
}
