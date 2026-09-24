import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
