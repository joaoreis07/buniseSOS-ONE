import { digitsOnly } from "@/modules/crm/lib/customer-normalize";

export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = digitsOnly(raw);
  if (!digits || digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length >= 12 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export function pickCustomerWhatsApp(customer: {
  whatsapp?: string | null;
  mobile?: string | null;
  phone?: string | null;
}): string | null {
  return (
    toWhatsAppNumber(customer.whatsapp) ??
    toWhatsAppNumber(customer.mobile) ??
    toWhatsAppNumber(customer.phone)
  );
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
