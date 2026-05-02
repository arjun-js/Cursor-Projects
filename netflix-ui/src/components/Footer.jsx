const columns = [
  ['Audio Description', 'Investor Relations', 'Legal Notices'],
  ['Help Center', 'Jobs', 'Cookie Preferences'],
  ['Gift Cards', 'Terms of Use', 'Corporate Information'],
  ['Media Center', 'Privacy', 'Contact Us'],
]

export function Footer() {
  return (
    <footer className="nf-footer">
      <div className="nf-footer__social">
        <span className="nf-footer__icon" aria-hidden>
          f
        </span>
        <span className="nf-footer__icon" aria-hidden>
          𝕏
        </span>
        <span className="nf-footer__icon" aria-hidden>
          ▶
        </span>
        <span className="nf-footer__icon" aria-hidden>
          in
        </span>
      </div>
      <div className="nf-footer__grid">
        {columns.map((col, i) => (
          <ul key={i} className="nf-footer__list">
            {col.map((link) => (
              <li key={link}>
                <a href="#">{link}</a>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <p className="nf-footer__meta">UI demo — not affiliated with Netflix.</p>
    </footer>
  )
}
