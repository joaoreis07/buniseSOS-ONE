import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoShell } from "@/modules/marketing/components/demo-shell";
import { DEMO_MODULES, isDemoModule } from "@/modules/marketing/demo-nav";

export const metadata: Metadata = {
  title: "Demonstração",
  description:
    "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar.",
};

export function generateStaticParams() {
  return DEMO_MODULES.map((module) => ({ module }));
}

export default async function DemoModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!isDemoModule(module)) {
    notFound();
  }
  return <DemoShell module={module} />;
}
