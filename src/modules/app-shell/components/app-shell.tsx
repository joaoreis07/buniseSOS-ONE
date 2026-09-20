import { AppHeader } from "@/modules/app-shell/components/app-header";
import { AppSidebar } from "@/modules/app-shell/components/app-sidebar";
import type { AppSessionUser } from "@/shared/auth/session";
import { getUserInitials } from "@/shared/auth/session";
import type { NotificationType } from "@prisma/client";

type AppShellProps = {
  user: AppSessionUser;
  companyName: string;
  children: React.ReactNode;
  notifications?: {
    unreadCount: number;
    items: Array<{
      id: string;
      type: NotificationType;
      title: string;
      message: string;
      link: string | null;
      readAt: Date | null;
      createdAt: Date;
    }>;
  } | null;
};

export function AppShell({ user, companyName, children, notifications }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <AppSidebar role={user.role} companyName={companyName} />
      <div className="min-w-0 lg:pl-64">
        <AppHeader
          userName={user.name}
          userEmail={user.email}
          role={user.role}
          initials={getUserInitials(user.name, user.email)}
          notifications={notifications}
        />
        <main className="app-surface min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-9 lg:py-8 print:p-0">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
