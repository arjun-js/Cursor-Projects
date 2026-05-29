import { UPS_PROXY_PATH, UPS_TARGET } from '../config';

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;

  const parts = host.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;

  return false;
}

function upsTargetHost() {
  try {
    return new URL(UPS_TARGET).host;
  } catch {
    return '';
  }
}

/** Sites that refuse iframe embedding — use pop-out window instead. */
export function isFrameBlockedSite(url) {
  if (url.startsWith('/')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const blocked = [
      'google.com',
      'www.google.com',
      'google.co.uk',
      'www.google.co.uk',
      'x.com',
      'twitter.com',
      'www.twitter.com',
      'mobile.twitter.com',
      'facebook.com',
      'www.facebook.com',
      'instagram.com',
      'www.instagram.com',
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'linkedin.com',
      'www.linkedin.com',
      'github.com',
      'www.github.com',
      'accounts.google.com',
    ];
    return (
      blocked.includes(host) ||
      host.endsWith('.google.com') ||
      host.endsWith('.twitter.com') ||
      host.endsWith('.facebook.com')
    );
  } catch {
    return false;
  }
}

function toUpsProxyPath(normalized) {
  try {
    const url = new URL(normalized);
    if (url.host !== upsTargetHost()) return null;
    const path = url.pathname + url.search + url.hash;
    const base = UPS_PROXY_PATH.replace(/\/$/, '');
    return path === '/' ? `${base}/` : `${base}${path}`;
  } catch {
    return null;
  }
}

/**
 * @returns {{ mode: 'iframe' | 'popup', url: string } | null}
 */
export function resolveNavigation(input) {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;

  if (normalized.startsWith('/')) {
    if (normalized.startsWith(UPS_PROXY_PATH.replace(/\/$/, ''))) {
      return { mode: 'iframe', url: normalized };
    }
    return null;
  }

  const proxied = toUpsProxyPath(normalized);
  if (proxied) {
    return { mode: 'iframe', url: proxied };
  }

  if (isFrameBlockedSite(normalized)) {
    return { mode: 'popup', url: normalized };
  }

  if (isPrivateOrLocalHost(new URL(normalized).hostname)) {
    return null;
  }

  return { mode: 'iframe', url: normalized };
}

export function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  let withProtocol = trimmed;

  if (!hasProtocol) {
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
  if (url.startsWith('/ups-proxy')) {
    try {
      return new URL(UPS_TARGET).host;
    } catch {
      return 'UPS device';
    }
  }
  try {
    return new URL(url).host;
  } catch {
    return 'New tab';
  }
}
