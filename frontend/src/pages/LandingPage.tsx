import Header from '../components/Header.tsx'
import Hero from '../components/Hero.tsx'
import OngoingEvents from '../components/OngoingEvents.tsx'
import CTA from '../components/CTA.tsx'
import Footer from '../components/Footer.tsx'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col pt-16">
            <Header />
            <Hero />
            <OngoingEvents />
            <CTA />
            <Footer />
        </div>
    )
}
