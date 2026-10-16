import AboutSection from "./components/AboutSection";
import ApproachSection from "./components/ApproachSection";
import CapabilitiesSection from "./components/CapabilitiesSection";
import ContactSection from "./components/ContactSection";
import HeroSection from "./components/HeroSection";
import InsightsSection from "./components/InsightsSection";
import NavigationRail from "./components/NavigationRail";
import PrecisionCursor from "./components/PrecisionCursor";
import WorkSection from "./components/WorkSection";
import {
  CAPABILITIES,
  CORE_LINE,
  HERO_MESSAGES,
  HERO_TITLE,
  INSIGHTS,
  SITE_TITLE
} from "./public.constants";
import "./public-site.css";

export function HomePage() {
  return (
    <div className="codexsun-public-site codexsun-home-shell">
      <NavigationRail siteTitle={SITE_TITLE} coreLine={CORE_LINE} />
      <PrecisionCursor />
      <main className="codexsun-home-main">
        <HeroSection heroTitle={HERO_TITLE} messages={HERO_MESSAGES} />
        <WorkSection />
        <ApproachSection />
        <CapabilitiesSection capabilities={CAPABILITIES} />
        <InsightsSection insights={INSIGHTS} />
        <AboutSection />
        <ContactSection
          contactEmail="hello@codexsun.com"
          contactLocation="India / Global delivery"
        />
      </main>
    </div>
  );
}
