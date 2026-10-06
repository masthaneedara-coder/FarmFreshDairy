export function normalizeIndianPhone(phone) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  if (/^0[6-9]\d{9}$/.test(digits)) {
    return digits.slice(1);
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}