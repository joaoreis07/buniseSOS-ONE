import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produtos — Demonstração",
};

export default function DemoProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
