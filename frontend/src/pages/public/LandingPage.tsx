import Hero from '../../components/landing/Hero.tsx'
import OngoingEvents from '../../components/landing/OngoingEvents.tsx'
import CTA from '../../components/landing/CTA.tsx'
import SupportChat from "../../components/ui/SupportChat.tsx";

export default function LandingPage() {
    return (
        <>
        <SupportChat />
        <div className="min-h-screen bg-white flex flex-col pt-16">
            <Hero />
            <OngoingEvents />
            <CTA />
        </div>
        </>
    )
}
