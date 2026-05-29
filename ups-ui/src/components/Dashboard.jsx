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
          Five independent browser panes — enter a URL in any pane to load the site.
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
