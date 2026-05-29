import { PANE_URLS } from '../config';
import BrowserPane from './BrowserPane';
import './Dashboard.css';

const PANES = PANE_URLS.map((initialUrl, i) => ({
  id: i + 1,
  label: `UPS ${i + 1}`,
  initialUrl,
}));

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">UPS Dashboard</h1>
        <p className="dashboard__subtitle">
          LAN UPS in-grid via <code>/ups-proxy/</code>. Google, X/Twitter, etc. open in pop-out
          windows (required — they block iframes).
        </p>
      </header>

      <main className="dashboard__grid" aria-label="Browser panes">
        {PANES.map((pane) => (
          <BrowserPane
            key={pane.id}
            paneId={pane.id}
            label={pane.label}
            initialUrl={pane.initialUrl}
          />
        ))}
      </main>
    </div>
  );
}
