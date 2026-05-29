import { useCallback, useEffect, useRef, useState } from 'react';
import { displayHost, isLikelyFrameBlockedHost, normalizeUrl } from '../utils/url';
import './BrowserPane.css';

export default function BrowserPane({ paneId, label, initialUrl = '' }) {
  const iframeRef = useRef(null);
  const [inputValue, setInputValue] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState('');
  const [history, setHistory] = useState({ entries: [], index: -1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { entries, index } = history;
  const canGoBack = index > 0;
  const canGoForward = index >= 0 && index < entries.length - 1;
  const tabTitle = activeUrl ? displayHost(activeUrl) : label;

  const navigateTo = useCallback((rawUrl) => {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      setError('Enter a valid http or https URL.');
      return;
    }

    if (isLikelyFrameBlockedHost(normalized)) {
      setError(
        'This site blocks embedding in iframes (e.g. X/Twitter). Use a local URL such as http://192.168.1.10:8080 instead.',
      );
      return;
    }

    setError('');
    setInputValue(normalized);
    setActiveUrl(normalized);
    setLoading(true);

    setHistory(({ entries: prevEntries, index: prevIndex }) => {
      const base = prevEntries.slice(0, prevIndex + 1);
      const nextEntries = [...base, normalized];
      return { entries: nextEntries, index: nextEntries.length - 1 };
    });
  }, []);

  useEffect(() => {
    if (!initialUrl) return;
    navigateTo(initialUrl);
  }, [initialUrl, navigateTo]);

  const goToHistoryIndex = (nextIndex) => {
    const url = entries[nextIndex];
    setHistory((prev) => ({ ...prev, index: nextIndex }));
    setInputValue(url);
    setActiveUrl(url);
    setLoading(true);
    setError('');
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
    if (!activeUrl || !iframeRef.current) return;
    setLoading(true);
    setError('');
    iframeRef.current.src = activeUrl;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigateTo(inputValue);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(
      'Could not load in this pane. If this is a LAN device, use http:// and include the port (e.g. http://192.168.1.10:8080). Some servers also block iframes.',
    );
  };

  return (
    <article className="browser-pane" aria-label={`Browser pane ${paneId}`}>
      <div className="browser-pane__chrome">
        <div className="browser-pane__tab" title={tabTitle}>
          <span className="browser-pane__tab-dot" aria-hidden />
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
              disabled={!activeUrl}
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
              placeholder="http://192.168.163.160"
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
        {loading && activeUrl && (
          <div className="browser-pane__loading" aria-live="polite">
            Loading…
          </div>
        )}

        {error && (
          <div className="browser-pane__error" role="alert">
            {error}
          </div>
        )}

        {!activeUrl && !error && (
          <div className="browser-pane__empty">
            <p>
              Enter a URL above. Local LAN sites work best (e.g.{' '}
              <code>http://192.168.1.10:3000</code>). Major sites like X.com block
              iframes.
            </p>
          </div>
        )}

        {activeUrl && (
          <iframe
            ref={iframeRef}
            className="browser-pane__frame"
            src={activeUrl}
            title={`${label} content`}
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-pointer-lock"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </article>
  );
}
