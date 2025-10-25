// Utility helpers for formatting and normalizing Malaysian phone numbers

export function normalizeMalaysiaPhone(input?: string | null): string {
  if (!input) return "";
  let s = input.trim();

  // Remove common separators but keep leading + if present
  s = s.replace(/[\s()-]/g, "");

  // If contains letters or other symbols, strip them
  s = s.replace(/[^\d+]/g, "");

  // Support international prefix typed as 00 (e.g., 0060...) by converting to +
  if (s.startsWith("00")) {
    s = "+" + s.slice(2);
  }

  // If already in international format, keep as-is (preserve other country codes)
  if (s.startsWith("+")) {
    return s;
  }

  // If it starts with 0 (local Malaysian format), convert to international +60
  if (s.startsWith("0")) {
    return "+60" + s.slice(1);
  }

  // If it starts with 60 (no plus), add plus
  if (s.startsWith("60")) {
    return "+" + s;
  }

  // Otherwise return digits-only string
  return s;
}

export function formatMalaysiaPhoneForDisplay(input?: string | null): string {
  if (!input) return "";

  const normalized = normalizeMalaysiaPhone(input);

  // If it's an international Malaysian number (+60...), render in local readable form
  if (normalized.startsWith("+60")) {
    const rest = normalized.slice(3); // digits after +60

    // Prepend local leading 0
    const local = "0" + rest;

    // Simple grouping: put a dash after the first 3 digits: 012-3456789
    if (local.length <= 3) return local;
    return local.slice(0, 3) + "-" + local.slice(3);
  }

  // If it's another international number (starts with + but not +60), preserve +CC and group remaining digits
  if (normalized.startsWith("+")) {
    const m = normalized.match(/^(\+(\d{1,3}))(\d+)$/);
    if (m) {
      const country = m[1];
      const rest = m[3];
      // Group rest in chunks of 3 for readability
      const grouped = rest.replace(/(\d{3})(?=\d)/g, "$1 ");
      return `${country} ${grouped}`;
    }
    return normalized;
  }

  // Fallback: group digits into chunks for readability
  const digits = normalized.replace(/\D/g, "");
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}
