export const PLAN_SLUG_FREE = "businessos-one-free" as const;
export const PLAN_SLUG_PRO = "businessos-one-monthly" as const;

export function isFreePlanSlug(slug: string) {
  return slug === PLAN_SLUG_FREE;
}

export function isProPlanSlug(slug: string) {
  return slug === PLAN_SLUG_PRO;
}
