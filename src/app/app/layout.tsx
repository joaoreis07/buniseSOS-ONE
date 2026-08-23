import { prisma } from "@/shared/db/prisma";
import { requireSession } from "@/shared/auth/session";
import { AppShell } from "@/modules/app-shell/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: { name: true },
  });

  return (
    <AppShell user={user} companyName={company?.name ?? "Empresa"}>
      {children}
    </AppShell>
  );
}
