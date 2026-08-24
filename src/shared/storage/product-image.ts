/**
 * Product image reference helpers.
 * Full file storage/upload is not wired in FASE 5 — we store only URL/path.
 */

export const PRODUCT_IMAGE_MAX_URL_LENGTH = 2048;

export function isAllowedProductImageReference(value: string): boolean {
  if (!value || value.length > PRODUCT_IMAGE_MAX_URL_LENGTH) return false;
  if (value.startsWith("data:")) return false;
  return (
    /^https?:\/\/.+/i.test(value) || /^\/uploads\/products\/.+/i.test(value)
  );
}
