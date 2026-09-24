"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { DEMO_NOTICE } from "@/modules/marketing/demo-data";
import { ProductShellLayout } from "@/modules/product-shell/product-shell-layout";
import { DEMO_SHELL_NAV_GROUPS } from "@/modules/product-shell/shell-nav";

export function DemoRootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/demo/dashboard";

  return (
    <ProductShellLayout
      pathname={pathname}
      navGroups={DEMO_SHELL_NAV_GROUPS}
      homeHref="/"
      isDemo
      notificationsHref="/demo/notifications"
      company={{
        name: "Empresa Exemplo Ltda.",
        subtitle: "CNPJ: 12.345.678/0001-90",
      }}
      user={{
        name: "João Silva",
        email: "demo@empresa.com.br",
        roleLabel: "Administrador",
        initials: "JS",
      }}
      onLogout={
        <Link
          href="/register"
          className="text-white/30 transition-colors hover:text-white/70"
          title="Começar agora"
        >
          <ArrowRight className="size-[13px]" aria-hidden />
        </Link>
      }
    >
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        {DEMO_NOTICE}
      </div>
      {children}
    </ProductShellLayout>
  );
}
