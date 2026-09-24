import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ShellNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** When true, active if pathname starts with href (except exact /app or /demo root). */
  matchPrefix?: boolean;
};

export type ShellNavGroup = {
  label: string;
  items: ShellNavItem[];
};

export type ShellUser = {
  name: string;
  email?: string | null;
  roleLabel: string;
  initials: string;
};

export type ShellCompany = {
  name: string;
  subtitle?: string | null;
};

export type ProductShellLayoutProps = {
  pathname: string;
  navGroups: ShellNavGroup[];
  company: ShellCompany;
  user: ShellUser;
  children: ReactNode;
  isDemo?: boolean;
  homeHref: string;
  notificationsHref?: string;
  helpHref?: string;
  onLogout?: ReactNode;
  notificationsSlot?: ReactNode;
  mobileNav?: ReactNode;
  filterNavItem?: (item: ShellNavItem) => boolean;
};
