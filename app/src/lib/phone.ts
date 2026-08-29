/**
 * Turkish mobile phone helpers. Numbers are stored and validated as 10 raw
 * digits starting with 5, no leading zero and no country code
 * (e.g. "5301234567" for "0530 123 45 67").
 */

export function normalizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function isValidTrPhone(digits: string): boolean {
  return /^5\d{9}$/.test(digits);
}

export function formatPhoneDisplay(digits: string): string {
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
  return parts.join(" ");
}

export function waLink(digits: string, text?: string): string {
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/90${digits}${params}`;
}
