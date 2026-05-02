export function HeroBanner({ feature }) {
  const { title, synopsis, backdrop, logoText } = feature

  return (
    <section className="nf-hero" aria-label="Featured title">
      <div
        className="nf-hero__bg"
        style={{ backgroundImage: `url(${backdrop})` }}
        role="img"
        aria-hidden
      />
      <div className="nf-hero__vignette" aria-hidden />
      <div className="nf-hero__bottom-fade" aria-hidden />

      <div className="nf-hero__content">
        <p className="nf-hero__badge">{logoText}</p>
        <h1 className="nf-hero__title">{title}</h1>
        <p className="nf-hero__synopsis">{synopsis}</p>
        <div className="nf-hero__actions">
          <button type="button" className="nf-btn nf-btn--primary">
            <span className="nf-btn__icon" aria-hidden>
              ▶
            </span>
            Play
          </button>
          <button type="button" className="nf-btn nf-btn--secondary">
            <span className="nf-btn__icon" aria-hidden>
              ℹ
            </span>
            More Info
          </button>
        </div>
      </div>
    </section>
  )
}
