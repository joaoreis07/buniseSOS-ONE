import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "BusinessOS One — Gestão completa para sua empresa",
    template: "%s — BusinessOS One",
  },
  description:
    "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar com o BusinessOS One.",
  applicationName: "BusinessOS One",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "BusinessOS One",
    title: "BusinessOS One — Gestão completa para sua empresa",
    description:
      "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar com o BusinessOS One.",
    images: [
      {
        url: "/brand/mark.jpg",
        width: 1024,
        height: 1024,
        alt: "BusinessOS One",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "BusinessOS One — Gestão completa para sua empresa",
    description:
      "Gerencie clientes, vendas, estoque, financeiro, compras e resultados em um só lugar com o BusinessOS One.",
    images: ["/brand/mark.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
