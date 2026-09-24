import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM — Demonstração",
};

export default function DemoCrmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
