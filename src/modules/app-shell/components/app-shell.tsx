import { AppHeader } from "@/modules/app-shell/components/app-header";
import { AppSidebar } from "@/modules/app-shell/components/app-sidebar";
import type { AppSessionUser } from "@/shared/auth/session";
import { getUserInitials } from "@/shared/auth/session";

type AppShellProps = {
  user: AppSessionUser;
  companyName: string;
  children: React.ReactNode;
};

export function AppShell({ user, companyName, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar role={user.role} companyName={companyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          userName={user.name}
          userEmail={user.email}
          role={user.role}
          initials={getUserInitials(user.name, user.email)}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
