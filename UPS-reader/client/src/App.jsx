import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  const [credsByHost, setCredsByHost] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("upsCredsByHost") || "{}");
    } catch {
      return {};
    }
  });

  const [baseUrlByHost, setBaseUrlByHost] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("upsBaseUrlByHost") || "{}");
    } catch {
      return {};
    }
  });

  const [statusByHost, setStatusByHost] = useState({});
  const [busyByHost, setBusyByHost] = useState({});

  useEffect(() => {
    localStorage.setItem("upsCredsByHost", JSON.stringify(credsByHost));
  }, [credsByHost]);

  useEffect(() => {
    localStorage.setItem("upsBaseUrlByHost", JSON.stringify(baseUrlByHost));
  }, [baseUrlByHost]);

  useEffect(() => {
    let cancelled = false;
    setLoadingHosts(true);
    fetch("/api/ups")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setHosts(list);
        setBaseUrlByHost((prev) => {
          const next = { ...prev };
          for (const h of list) {
            if (typeof next[h.id] !== "string" || !next[h.id].trim()) {
              next[h.id] = h.baseUrl;
            }
          }
          return next;
        });
        setGlobalError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setGlobalError("Could not load UPS host list. Is the server running?");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingHosts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pollIds = useMemo(() => hosts.map((h) => h.id), [hosts]);

  useEffect(() => {
    if (pollIds.length === 0) return;

    let cancelled = false;

    async function pollOnce() {
      await Promise.all(
        pollIds.map(async (id) => {
          const hasCreds = Boolean(credsByHost[id]?.username && credsByHost[id]?.password);
          if (!hasCreds) return;
          const baseUrl = baseUrlByHost[id];

          try {
            const qs = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : "";
            const r = await fetch(`/api/ups/${encodeURIComponent(id)}/status${qs}`);
            const data = await r.json();
            if (cancelled) return;
            setStatusByHost((prev) => ({ ...prev, [id]: { ...data, httpOk: r.ok } }));
          } catch {
            if (cancelled) return;
            setStatusByHost((prev) => ({
              ...prev,
              [id]: { ok: false, error: "Network error while fetching status" },
            }));
          }
        })
      );
    }

    pollOnce();
    const t = setInterval(pollOnce, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pollIds, credsByHost, baseUrlByHost]);

  async function loginHost(hostId) {
    const creds = credsByHost[hostId] || {};
    const baseUrl = baseUrlByHost[hostId];
    setBusyByHost((p) => ({ ...p, [hostId]: true }));
    try {
      const r = await fetch(`/api/ups/${encodeURIComponent(hostId)}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: creds.username, password: creds.password, baseUrl }),
      });
      const data = await r.json();
      setStatusByHost((prev) => ({ ...prev, [hostId]: { ...data, httpOk: r.ok } }));
    } catch {
      setStatusByHost((prev) => ({ ...prev, [hostId]: { ok: false, error: "Login network error" } }));
    } finally {
      setBusyByHost((p) => ({ ...p, [hostId]: false }));
    }
  }

  async function logoutHost(hostId) {
    setBusyByHost((p) => ({ ...p, [hostId]: true }));
    try {
      await fetch(`/api/ups/${encodeURIComponent(hostId)}/logout`, { method: "POST" });
      setStatusByHost((prev) => ({ ...prev, [hostId]: { ok: true, note: "Logged out" } }));
    } finally {
      setBusyByHost((p) => ({ ...p, [hostId]: false }));
    }
  }

  return (
    <div className="dash">
      <header className="topbar">
        <div>
          <h1>UPS Dashboard</h1>
          <p className="sub">
            One page view for all UPS hosts. Each card uses its own login session via the local proxy API.
          </p>
        </div>
        <div className="top-actions">
          <a className="pill" href="/api/health" target="_blank" rel="noreferrer">
            API health
          </a>
        </div>
      </header>

      {globalError && (
        <div className="alert alert-error" role="alert">
          {globalError}
        </div>
      )}

      {loadingHosts ? (
        <div className="loading">Loading UPS hosts…</div>
      ) : (
        <main className="grid">
          {hosts.map((h) => {
            const creds = credsByHost[h.id] || {};
            const baseUrl = baseUrlByHost[h.id] || h.baseUrl;
            const status = statusByHost[h.id];
            const busy = Boolean(busyByHost[h.id]);

            const statusLabel = status?.error
              ? "Error"
              : status?.hint
                ? "Needs login"
                : status?.preview
                  ? "OK"
                  : status?.note
                    ? "Info"
                    : "Unknown";

            const badgeClass =
              statusLabel === "OK" ? "badge ok" : statusLabel === "Needs login" ? "badge warn" : "badge bad";

            return (
              <section key={h.id} className="card">
                <div className="card-head">
                  <div>
                    <div className="title-row">
                      <h2>{h.name}</h2>
                      <span className={badgeClass}>{statusLabel}</span>
                    </div>
                    <div className="muted mono">{baseUrl}</div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="fields">
                    <label>
                      Base URL
                      <input
                        value={baseUrl}
                        onChange={(e) =>
                          setBaseUrlByHost((p) => ({
                            ...p,
                            [h.id]: e.target.value,
                          }))
                        }
                        placeholder="http://192.168.0.10"
                        autoComplete="off"
                        inputMode="url"
                      />
                    </label>
                    <label>
                      Username
                      <input
                        value={creds.username || ""}
                        onChange={(e) =>
                          setCredsByHost((p) => ({
                            ...p,
                            [h.id]: { ...p[h.id], username: e.target.value },
                          }))
                        }
                        placeholder="UPS username"
                        autoComplete="username"
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={creds.password || ""}
                        onChange={(e) =>
                          setCredsByHost((p) => ({
                            ...p,
                            [h.id]: { ...p[h.id], password: e.target.value },
                          }))
                        }
                        placeholder="UPS password"
                        autoComplete="current-password"
                      />
                    </label>
                  </div>

                  <div className="buttons">
                    <button
                      onClick={() => loginHost(h.id)}
                      disabled={busy || !creds.username || !creds.password}
                      className="primary"
                    >
                      {busy ? "Working…" : "Login"}
                    </button>
                    <button onClick={() => logoutHost(h.id)} disabled={busy} className="ghost">
                      Logout
                    </button>
                  </div>

                  <div className="status">
                    {status?.error ? (
                      <div className="err">{status.error}</div>
                    ) : status?.preview ? (
                      <>
                        <div className="meta">
                          <span>
                            HTTP: <span className="mono">{status.status}</span>
                          </span>
                          <span>
                            Content-Type: <span className="mono">{status.contentType || "?"}</span>
                          </span>
                          <span>
                            Updated:{" "}
                            <span className="mono">
                              {status.fetchedAt ? new Date(status.fetchedAt).toLocaleTimeString() : "—"}
                            </span>
                          </span>
                        </div>
                        <details>
                          <summary>Preview (first 2000 chars)</summary>
                          <pre className="preview">{status.preview}</pre>
                        </details>
                      </>
                    ) : status?.note ? (
                      <div className="muted">{status.note}</div>
                    ) : (
                      <div className="muted">
                        Enter credentials, click Login, then status will auto-refresh every 10 seconds.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </main>
      )}

      <footer className="foot">
        Configure UPS endpoints in <code className="mono">server/ups-hosts.js</code>. If your UPS uses HTTPS with a
        self-signed cert, start server with <code className="mono">UPS_INSECURE_TLS=true</code>.
      </footer>
    </div>
  );
}

export default App;
