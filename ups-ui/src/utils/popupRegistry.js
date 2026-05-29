const panePopups = new Map();

export function setPanePopup(paneId, win) {
  if (win) panePopups.set(paneId, win);
}

export function getPanePopup(paneId) {
  const win = panePopups.get(paneId);
  if (win && !win.closed) return win;
  panePopups.delete(paneId);
  return null;
}
