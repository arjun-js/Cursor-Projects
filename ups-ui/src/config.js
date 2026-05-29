/**
 * UPS device on your LAN (used by Vite proxy — see vite.config.js VITE_UPS_TARGET).
 * Add a port if needed: http://192.168.163.160:8080
 */
export const UPS_TARGET = 'http://192.168.163.160';

/** Same-origin path — iframes must use this instead of the raw IP. */
export const UPS_PROXY_PATH = '/ups-proxy/';

export const PANE_URLS = [
  UPS_PROXY_PATH,
  UPS_PROXY_PATH,
  UPS_PROXY_PATH,
  UPS_PROXY_PATH,
  UPS_PROXY_PATH,
];
