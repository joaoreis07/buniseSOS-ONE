import type { ProductShellLayoutProps } from "@/modules/product-shell/types";
import { ProductSidebar } from "@/modules/product-shell/product-sidebar";
import { ProductTopbar } from "@/modules/product-shell/product-topbar";

export function ProductShellLayout({
  pathname,
  navGroups,
  company,
  user,
  children,
  isDemo,
  homeHref,
  notificationsHref,
  helpHref,
  onLogout,
  notificationsSlot,
  mobileNav,
  filterNavItem,
}: ProductShellLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bos-background)" }}>
      <div className="hidden lg:block">
        <ProductSidebar
          homeHref={homeHref}
          company={company}
          user={user}
          navGroups={navGroups}
          pathname={pathname}
          isDemo={isDemo}
          notificationsHref={notificationsHref}
          helpHref={helpHref}
          onLogout={onLogout}
          filterNavItem={filterNavItem}
        />
      </div>
      <ProductTopbar
        isDemo={isDemo}
        user={user}
        mobileNav={
          mobileNav ?? (
            <ProductSidebar
              homeHref={homeHref}
              company={company}
              user={user}
              navGroups={navGroups}
              pathname={pathname}
              isDemo={isDemo}
              notificationsHref={notificationsHref}
              helpHref={helpHref}
              onLogout={onLogout}
              filterNavItem={filterNavItem}
            />
          )
        }
        notificationsSlot={notificationsSlot}
      />
      <main
        className="min-h-screen lg:ml-[var(--bos-sidebar-width)] print:ml-0 print:pt-0"
        style={{ paddingTop: "var(--bos-topbar-height)" }}
      >
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
