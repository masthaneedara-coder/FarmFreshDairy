export function normalizeIndianPhone(phone) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");

  // +91XXXXXXXXXX / 91XXXXXXXXXX
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  // 0XXXXXXXXXX
  if (/^0[6-9]\d{9}$/.test(digits)) {
    return digits.slice(1);
  }

  // XXXXXXXXXX
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}