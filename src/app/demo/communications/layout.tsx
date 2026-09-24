import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunicações — Demonstração",
};

export default function DemoCommunicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
