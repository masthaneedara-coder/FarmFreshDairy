
import crypto from "crypto";

const SECRET = process.env.ADMIN_JWT_SECRET;
const TOKEN_EXPIRY_SECONDS = Number(
  process.env.ADMIN_TOKEN_EXPIRY_SECONDS || 28800
);

function getSecret() {
  if (!SECRET) {
    throw new Error("ADMIN_JWT_SECRET is not configured.");
  }

  return SECRET;
}

export function createAdminToken(admin) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: admin.id,
    role: String(admin.role || "").toLowerCase(),
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  };

  const encodedPayload = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid admin token.");
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    throw new Error("Invalid admin token.");
  }

  const [encodedPayload, suppliedSignature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest();

  let actualSignature;

  try {
    actualSignature = Buffer.from(
      suppliedSignature,
      "base64url"
    );
  } catch {
    throw new Error("Invalid admin token.");
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      actualSignature,
      expectedSignature
    )
  ) {
    throw new Error("Invalid admin token.");
  }

  let payload;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
  } catch {
    throw new Error("Invalid admin token.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    !payload.sub ||
    !payload.exp ||
    payload.exp <= now ||
    !["admin", "super_admin"].includes(payload.role)
  ) {
    throw new Error("Admin token is expired or invalid.");
  }

  return payload;
}
