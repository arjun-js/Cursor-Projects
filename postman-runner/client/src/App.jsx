import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [scenario, setScenario] = useState("");
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then(setAvailable)
      .catch(() => setError("Could not load scenarios. Is the server running?"));
  }, []);

  async function handleRun(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Run failed");
        if (data.availableScenarios) {
          setResult({ availableScenarios: data.availableScenarios });
        }
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Start the server with npm run dev.");
    } finally {
      setLoading(false);
    }
  }

  function useExample(text) {
    setScenario(text);
    setResult(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo" aria-hidden="true">
          <span className="logo-mark">▶</span>
        </div>
        <div>
          <h1>Postman Collection Runner</h1>
          <p className="subtitle">
            Describe a scenario in plain text — we match it to a Postman collection and run it with Newman.
          </p>
        </div>
      </header>

      <main className="main">
        <form className="run-form" onSubmit={handleRun}>
          <label htmlFor="scenario">Scenario</label>
          <textarea
            id="scenario"
            rows={3}
            placeholder="e.g. run user crud tests, todo checklist api, blog posts workflow"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !scenario.trim()}>
            {loading ? "Running collection…" : "Run collection"}
          </button>
        </form>

        <section className="scenarios-panel">
          <h2>Available scenarios</h2>
          <div className="scenario-cards">
            {available.map((s) => (
              <article key={s.id} className="scenario-card">
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <ul className="examples">
                  {s.examples?.map((ex) => (
                    <li key={ex}>
                      <button type="button" className="example-btn" onClick={() => useExample(ex)}>
                        {ex}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {result?.availableScenarios && (
          <div className="alert alert-hint">
            <strong>Try one of these:</strong>
            <ul>
              {result.availableScenarios.flatMap((s) =>
                s.examples.map((ex) => (
                  <li key={ex}>
                    <button type="button" className="link-btn" onClick={() => useExample(ex)}>
                      {ex}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {result?.matchedScenario && (
          <section className="results">
            <div className={`result-banner ${result.success ? "pass" : "fail"}`}>
              <span className="result-icon">{result.success ? "✓" : "✗"}</span>
              <div>
                <strong>{result.success ? "All tests passed" : "Some tests failed"}</strong>
                <p>
                  Matched <em>{result.matchedScenario.name}</em> for “{result.input}”
                </p>
              </div>
              {result.summary && (
                <dl className="summary-stats">
                  <div>
                    <dt>Requests</dt>
                    <dd>
                      {result.summary.totalRequests - result.summary.failedRequests}/
                      {result.summary.totalRequests}
                    </dd>
                  </div>
                  <div>
                    <dt>Assertions</dt>
                    <dd>
                      {result.summary.totalAssertions - result.summary.failedAssertions}/
                      {result.summary.totalAssertions}
                    </dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{result.summary.totalTimeMs}ms</dd>
                  </div>
                </dl>
              )}
            </div>

            <h2>Request results</h2>
            <div className="execution-list">
              {result.executions?.map((exec) => (
                <details key={exec.request} className={`execution ${exec.passed ? "passed" : "failed"}`} open>
                  <summary>
                    <span className={`status-dot ${exec.passed ? "pass" : "fail"}`} />
                    <span className="exec-name">{exec.request}</span>
                    <span className="exec-meta">
                      {exec.method} · {exec.status} · {exec.timeMs}ms
                    </span>
                  </summary>
                  <div className="exec-body">
                    <p className="exec-url">{exec.url}</p>
                    {exec.failedAssertions?.length > 0 && (
                      <ul className="assertion-failures">
                        {exec.failedAssertions.map((msg) => (
                          <li key={msg}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        Collections use{" "}
        <a href="https://jsonplaceholder.typicode.com/" target="_blank" rel="noreferrer">
          JSONPlaceholder
        </a>{" "}
        — free fake REST API for testing.
      </footer>
    </div>
  );
}
