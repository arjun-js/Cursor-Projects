import { useRef } from 'react'

export function ContentRow({ title, items }) {
  const trackRef = useRef(null)

  const scrollByDir = (dir) => {
    const el = trackRef.current
    if (!el) return
    const delta = Math.round(el.clientWidth * 0.72) * dir
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="nf-row">
      <h2 className="nf-row__title">{title}</h2>
      <div className="nf-row__wrap">
        <button
          type="button"
          className="nf-row__chev nf-row__chev--left"
          aria-label={`Scroll ${title} left`}
          onClick={() => scrollByDir(-1)}
        >
          ‹
        </button>
        <div className="nf-row__track" ref={trackRef}>
          {items.map((item) => (
            <article key={item.id} className="nf-card">
              <img src={item.image} alt="" className="nf-card__img" loading="lazy" />
              <div className="nf-card__meta">
                <span className="nf-card__label">{item.title}</span>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="nf-row__chev nf-row__chev--right"
          aria-label={`Scroll ${title} right`}
          onClick={() => scrollByDir(1)}
        >
          ›
        </button>
      </div>
    </section>
  )
}
