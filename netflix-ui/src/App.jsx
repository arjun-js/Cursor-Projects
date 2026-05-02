import { ContentRow } from './components/ContentRow.jsx'
import { Footer } from './components/Footer.jsx'
import { Header } from './components/Header.jsx'
import { HeroBanner } from './components/HeroBanner.jsx'
import { heroFeature, rows } from './data/content.js'
import './App.css'

export default function App() {
  return (
    <div className="nf-app">
      <Header />
      <main>
        <HeroBanner feature={heroFeature} />
        <div className="nf-rows">
          {rows.map((row) => (
            <ContentRow key={row.id} title={row.title} items={row.items} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
