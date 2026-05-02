import { useEffect, useState } from 'react'

const links = ['Home', 'TV Shows', 'Movies', 'New & Popular', 'My List']

export function Header() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nf-nav ${solid ? 'nf-nav--solid' : ''}`}>
      <div className="nf-nav__inner">
        <div className="nf-nav__left">
          <span className="nf-logo" aria-label="Netflix">
            NETFLIX
          </span>
          <nav className="nf-nav__links" aria-label="Primary">
            {links.map((label) => (
              <a key={label} href="#" className="nf-nav__link">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="nf-nav__right">
          <button type="button" className="nf-icon-btn" aria-label="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button type="button" className="nf-icon-btn" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
            </svg>
          </button>
          <button type="button" className="nf-profile" aria-label="Account">
            <span className="nf-profile__avatar" />
            <span className="nf-profile__caret" aria-hidden>
              ▾
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
