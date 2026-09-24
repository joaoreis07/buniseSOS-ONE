import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/utilities/cn";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

const pageTabClass = (isActive: boolean) =>
  cn(
    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
    isActive
      ? "bg-[var(--bos-primary)] text-white shadow-sm"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );

export function PageTabs({
  items,
  active,
  className,
  onSelect,
}: {
  items: Array<{ id: string; href?: string; label: string; icon?: ReactNode }>;
  active: string;
  className?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <nav
      className={cn(
        "mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1",
        className,
      )}
      aria-label="Navegação da seção"
    >
      {items.map((item) => {
        const isActive = active === item.id;
        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={pageTabClass(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={pageTabClass(isActive)}
            aria-current={isActive ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function CrmSectionHeader({ title = "CRM" }: { title?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
    </div>
  );
}

export function ModulePageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function FilterPillNav({
  basePath,
  param = "status",
  active,
  options,
  preserve,
}: {
  basePath: string;
  param?: string;
  active: string;
  options: Array<{ value: string; label: string }>;
  preserve?: Record<string, string | null | undefined>;
}) {
  function hrefFor(value: string) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(preserve ?? {})) {
      if (val != null && val !== "" && key !== param && key !== "page") {
        params.set(key, val);
      }
    }
    if (value) params.set(param, value);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
      {options.map((option) => (
        <Link
          key={option.value || "all"}
          href={hrefFor(option.value)}
          className={cn(
            "shrink-0 rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all",
            active === option.value
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

export function PaginationBar({
  page,
  pageCount,
  total,
  totalLabel,
  prevHref,
  nextHref,
}: {
  page: number;
  pageCount: number;
  total: number;
  totalLabel: string;
  prevHref?: string;
  nextHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">
        {total} {totalLabel} · página {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        {prevHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={prevHref}>Anterior</Link>
          </Button>
        ) : null}
        {nextHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={nextHref}>Próxima</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  footerLink,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  footerLink?: { href: string; label: string };
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      {title || description || action ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            {title ? (
              <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            ) : null}
          </div>
          {action}
          {footerLink ? (
            <Link
              href={footerLink.href}
              className="flex items-center gap-1 text-xs text-[var(--bos-primary)] hover:underline"
            >
              {footerLink.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className={title || description || action ? "px-5 py-4" : "p-5 sm:p-6"}>
        {children}
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  sub,
  icon: Icon,
  iconNode,
  tone = "blue",
  trend,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  tone?: "blue" | "emerald" | "amber" | "rose" | "slate" | "green";
  trend?: { value: number; label?: string };
  className?: string;
}) {
  const tones = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-red-600 bg-red-50",
    slate: "text-slate-600 bg-slate-50",
  };
  const subText = sub ?? hint;
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {(Icon || iconNode) && (
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tones[tone === "green" ? "green" : tone],
            )}
          >
            {iconNode ?? (Icon ? <Icon className="size-[15px]" aria-hidden /> : null)}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {subText ? <div className="mt-0.5 text-xs text-slate-400">{subText}</div> : null}
      </div>
      {trend ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-slate-400",
          )}
        >
          <span>{isPositive ? "↑" : isNegative ? "↓" : "→"}</span>
          <span>
            {Math.abs(trend.value)}% {trend.label ?? "vs mês anterior"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function UsageMeter({
  label,
  used,
  limit,
  status,
}: {
  label: string;
  used: number;
  limit: number;
  status?: "ok" | "warning" | "blocked";
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isBlocked = status === "blocked" || used >= limit;
  const isHigh = status === "warning" || (!isBlocked && pct >= 80);
  return (
    <div>
      <div className={cn("flex items-center justify-between", label ? "mb-1" : "")}>
        {label ? <span className="text-xs text-slate-600">{label}</span> : <span />}
        <span
          className={cn(
            "text-xs font-semibold",
            isBlocked ? "text-red-600" : isHigh ? "text-amber-600" : "text-slate-500",
          )}
        >
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isBlocked ? "bg-red-400" : isHigh ? "bg-amber-400" : "bg-[var(--bos-primary)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PlanUsageCard({
  items,
  upgradeHref = "/app/settings/billing",
}: {
  items: Array<{ label: string; used: number; limit: number | null }>;
  upgradeHref?: string;
}) {
  const limited = items.filter((item) => item.limit != null);
  if (limited.length === 0) return null;

  return (
    <SectionCard
      title="Uso do plano Free"
      action={
        <Link href={upgradeHref} className="text-xs text-[var(--bos-primary)] hover:underline">
          Fazer upgrade
        </Link>
      }
    >
      <div className="space-y-3.5 px-5 py-4">
        {limited.slice(0, 5).map((item) => (
          <UsageMeter
            key={item.label}
            label={item.label}
            used={item.used}
            limit={item.limit!}
          />
        ))}
      </div>
    </SectionCard>
  );
}

export function MetricList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm"
        >
          <span className="text-slate-500">{item.label}</span>
          <strong className="text-right font-semibold tracking-[-0.02em] text-slate-950">
            {item.value}
          </strong>
        </li>
      ))}
    </ul>
  );
}

export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="mt-4 font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

export function ErrorState({
  title = "Não foi possível carregar a tela",
  description = "Tente novamente. Se o problema continuar, fale com o administrador.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-rose-100 bg-white px-6 py-12 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {onRetry ? (
        <Button type="button" className="mt-5" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
