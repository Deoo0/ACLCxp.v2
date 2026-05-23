import Header from '../components/layouts/Header.tsx'
import Hero from '../components/sections/Hero.tsx'
import OngoingEvents from '../components/sections/OngoingEvents.tsx'
import CTA from '../components/sections/CTA.tsx'
import Footer from '../components/layouts/Footer.tsx'
import SupportChat from "../components/SupportChat";

export default function LandingPage() {
    return (
        <>
        <SupportChat />
        <div className="min-h-screen bg-white flex flex-col pt-16">
            <Header />
            <Hero />
            <OngoingEvents />
            <CTA />
            <Footer />
        </div>
        </>
    )
}
