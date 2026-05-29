function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;

  // IPv4
  const parts = host.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true; // link-local

  return false;
}

export function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  let withProtocol = trimmed;

  if (!hasProtocol) {
    // host:port/path without scheme — peek hostname for http vs https default
    const hostPart = trimmed.split(/[/:?#]/)[0];
    const defaultScheme = isPrivateOrLocalHost(hostPart) ? 'http' : 'https';
    withProtocol = `${defaultScheme}://${trimmed}`;
  }

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function displayHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'New tab';
  }
}

export function isLikelyFrameBlockedHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const blocked = [
      'x.com',
      'twitter.com',
      'facebook.com',
      'www.facebook.com',
      'instagram.com',
      'www.instagram.com',
      'google.com',
      'www.google.com',
      'youtube.com',
      'www.youtube.com',
      'github.com',
      'www.github.com',
    ];
    return blocked.includes(host) || host.endsWith('.google.com');
  } catch {
    return false;
  }
}
