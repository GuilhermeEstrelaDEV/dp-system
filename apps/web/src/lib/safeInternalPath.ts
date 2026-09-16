const SAFE_FALLBACK_PATH = '/';
const SAFE_INTERNAL_ORIGIN = 'https://dp-system.invalid';

export function safeInternalPath(value: unknown, fallback: string = SAFE_FALLBACK_PATH): string {
  if (typeof value !== 'string') return fallback;

  const candidate = value.trim();
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /%5c/iu.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, SAFE_INTERNAL_ORIGIN);
    if (parsed.origin !== SAFE_INTERNAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
