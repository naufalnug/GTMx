import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Services from './components/Services'
import CaseStudies from './components/CaseStudies'
import TechStack from './components/TechStack'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Services />
        <CaseStudies />
        <TechStack />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

export default App
