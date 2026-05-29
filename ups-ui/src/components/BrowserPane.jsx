import { useCallback, useEffect, useRef, useState } from 'react';
import { UPS_PROXY_PATH } from '../config';
import { getPanePopup, setPanePopup } from '../utils/popupRegistry';
import { displayHost, resolveNavigation } from '../utils/url';
import './BrowserPane.css';

const POPUP_FEATURES =
  'popup=yes,toolbar=yes,location=yes,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=960,height=720';

function popupWindowName(paneId) {
  return `ups-pane-${paneId}`;
}

export default function BrowserPane({ paneId, label, initialUrl = '' }) {
  const iframeRef = useRef(null);
  const popupRef = useRef(null);
  const initialLoadDone = useRef(false);
  const [inputValue, setInputValue] = useState(initialUrl || UPS_PROXY_PATH);
  const [activeNav, setActiveNav] = useState(null);
  const [history, setHistory] = useState({ entries: [], index: -1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popupMissing, setPopupMissing] = useState(false);

  const activeUrl = activeNav?.url ?? '';
  const { entries, index } = history;
  const canGoBack = index > 0;
  const canGoForward = index >= 0 && index < entries.length - 1;
  const tabTitle = activeUrl ? displayHost(activeUrl) : label;
  const isPopup = activeNav?.mode === 'popup';

  const resolvePopup = useCallback(() => {
    const fromRef = popupRef.current;
    if (fromRef && !fromRef.closed) return fromRef;
    const fromRegistry = getPanePopup(paneId);
    if (fromRegistry) {
      popupRef.current = fromRegistry;
      return fromRegistry;
    }
    return null;
  }, [paneId]);

  const focusPopup = useCallback(() => {
    setPopupMissing(false);
    const win = resolvePopup();
    if (win) {
      win.focus();
      return;
    }
    setPopupMissing(true);
  }, [resolvePopup]);

  const openPopup = useCallback(
    (url) => {
      setPopupMissing(false);
      const name = popupWindowName(paneId);
      const existing = resolvePopup();

      if (existing) {
        if (url) existing.location.href = url;
        existing.focus();
        setPanePopup(paneId, existing);
        return;
      }

      const win = window.open(url, name, POPUP_FEATURES);
      popupRef.current = win;
      setPanePopup(paneId, win);
    },
    [paneId, resolvePopup],
  );

  const navigateTo = useCallback(
    (rawUrl) => {
      const nav = resolveNavigation(rawUrl);
      if (!nav) {
        setError(
          'Invalid URL. Use /ups-proxy/ or your UPS IP for LAN devices, or sites like google.com / x.com for pop-out.',
        );
        return;
      }

      setError('');
      setInputValue(nav.url);
      setActiveNav(nav);
      setLoading(nav.mode === 'iframe');

      if (nav.mode === 'popup') {
        openPopup(nav.url);
      }

      setHistory(({ entries: prevEntries, index: prevIndex }) => {
        const base = prevEntries.slice(0, prevIndex + 1);
        const nextEntries = [...base, nav];
        return { entries: nextEntries, index: nextEntries.length - 1 };
      });
    },
    [openPopup],
  );

  useEffect(() => {
    if (!initialUrl || initialLoadDone.current) return;
    initialLoadDone.current = true;
    navigateTo(initialUrl);
  }, [initialUrl, navigateTo]);

  const goToHistoryIndex = (nextIndex) => {
    const nav = entries[nextIndex];
    setHistory((prev) => ({ ...prev, index: nextIndex }));
    setInputValue(nav.url);
    setActiveNav(nav);
    setLoading(nav.mode === 'iframe');
    setError('');

    if (nav.mode === 'popup') {
      openPopup(nav.url);
    }
  };

  const goBack = () => {
    if (!canGoBack) return;
    goToHistoryIndex(index - 1);
  };

  const goForward = () => {
    if (!canGoForward) return;
    goToHistoryIndex(index + 1);
  };

  const reload = () => {
    if (!activeNav) return;
    if (activeNav.mode === 'popup') {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.location.reload();
      } else {
        openPopup(activeNav.url);
      }
      return;
    }
    if (!iframeRef.current) return;
    setLoading(true);
    setError('');
    const frame = iframeRef.current;
    frame.src = '';
    frame.src = activeNav.url;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigateTo(inputValue);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const openNewTab = () => {
    if (activeUrl) window.open(activeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="browser-pane" aria-label={`Browser pane ${paneId}`}>
      <div className="browser-pane__chrome">
        <div className="browser-pane__tab" title={tabTitle}>
          <span
            className={`browser-pane__tab-dot${isPopup ? ' browser-pane__tab-dot--popup' : ''}`}
            aria-hidden
          />
          <span className="browser-pane__tab-title">{tabTitle}</span>
        </div>

        <div className="browser-pane__toolbar">
          <div className="browser-pane__nav">
            <button
              type="button"
              className="browser-pane__btn"
              onClick={goBack}
              disabled={!canGoBack}
              title="Back"
              aria-label="Back"
            >
              ‹
            </button>
            <button
              type="button"
              className="browser-pane__btn"
              onClick={goForward}
              disabled={!canGoForward}
              title="Forward"
              aria-label="Forward"
            >
              ›
            </button>
            <button
              type="button"
              className="browser-pane__btn"
              onClick={reload}
              disabled={!activeNav}
              title="Reload"
              aria-label="Reload"
            >
              ↻
            </button>
          </div>

          <form className="browser-pane__address" onSubmit={handleSubmit}>
            <input
              type="text"
              className="browser-pane__url-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="google.com, x.com, /ups-proxy/"
              spellCheck={false}
              aria-label={`URL for ${label}`}
            />
            <button type="submit" className="browser-pane__go">
              Go
            </button>
          </form>
        </div>
      </div>

      <div className="browser-pane__viewport">
        {loading && activeNav?.mode === 'iframe' && (
          <div className="browser-pane__loading" aria-live="polite">
            Loading…
          </div>
        )}

        {error && (
          <div className="browser-pane__error" role="alert">
            {error}
          </div>
        )}

        {!activeNav && !error && (
          <div className="browser-pane__empty">
            <p>
              <strong>LAN UPS:</strong> <code>/ups-proxy/</code> or device IP (in-grid).
            </p>
            <p>
              <strong>Google, X/Twitter, etc.:</strong> type the URL and press Go — opens in a
              pop-out window (these sites block iframes).
            </p>
          </div>
        )}

        {activeNav?.mode === 'iframe' && (
          <iframe
            ref={iframeRef}
            className="browser-pane__frame"
            src={activeNav.url}
            title={`${label} content`}
            onLoad={handleIframeLoad}
          />
        )}

        {activeNav?.mode === 'popup' && (
          <div className="browser-pane__popup-panel">
            <div className="browser-pane__popup-icon" aria-hidden>
              ↗
            </div>
            <h3 className="browser-pane__popup-title">{displayHost(activeNav.url)}</h3>
            <p className="browser-pane__popup-url">{activeNav.url}</p>
            <p className="browser-pane__popup-hint">
              Google, X/Twitter, and similar sites cannot be shown inside the dashboard grid.
              They open in a separate browser window instead.
            </p>
            {popupMissing && (
              <p className="browser-pane__popup-missing" role="status">
                Pop-out was closed. Press <strong>Go</strong> in the address bar to open it again.
              </p>
            )}
            <div className="browser-pane__popup-actions">
              <button type="button" className="browser-pane__popup-btn" onClick={focusPopup}>
                Focus pop-out window
              </button>
              <button type="button" className="browser-pane__popup-btn browser-pane__popup-btn--secondary" onClick={openNewTab}>
                Open in new tab
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
