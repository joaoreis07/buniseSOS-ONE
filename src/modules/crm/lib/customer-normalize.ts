export function digitsOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function phoneKey(value: string | null | undefined): string | null {
  const digits = digitsOnly(value);
  if (!digits || digits.length < 10) return null;
  return digits;
}
