const BEARER_SCHEME = "bearer";

/**
 * Pulls the raw token out of an `Authorization: Bearer <token>` header.
 * Returns null for a missing header, a different scheme, or an empty token —
 * all of which the caller answers with a 401.
 *
 * The scheme name is compared case-insensitively because RFC 7235 defines it
 * that way, but the token itself is returned untouched.
 */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme.toLowerCase() !== BEARER_SCHEME) return null;

  const token = rest.join(" ").trim();
  return token === "" ? null : token;
}
