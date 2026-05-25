import Navbar from '@/components/Navbar';
import CoinCanvas from '@/components/CoinCanvas';
import HeroSection from '@/components/sections/HeroSection';
import SystemActivation from '@/components/sections/SystemActivation';
import AutomationSection from '@/components/sections/AutomationSection';
import TrustSection from '@/components/sections/TrustSection';
import MobileAppSection from '@/components/sections/Mobileappsection';
import CTASection from '@/components/sections/CTASection';

export default function Home() {
    return (
        <main className="relative bg-background-primary">
            {/* Fixed Navigation */}
            <Navbar />

            {/* Scroll-Linked Coin Canvas */}
            <CoinCanvas totalFrames={240} framePrefix="ezgif-frame-" />

            {/* Content Sections */}
            <div className="relative z-10">
                {/* Hero / Intro */}
                <HeroSection />

                {/* How It Works */}
                <SystemActivation />

                {/* Automation & Reminders */}
                <AutomationSection />

                {/* Trust & Security */}
                <TrustSection />

                {/* Mobile App */}
                <MobileAppSection />

                {/* CTA */}
                <CTASection />
            </div>
        </main>
    );
}