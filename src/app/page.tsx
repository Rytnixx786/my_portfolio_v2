import { HeroEditorial } from "@/components/hero/HeroEditorial";
import { TelemetryMarquee } from "@/components/sections/TelemetryMarquee";
import { SelectedWorkSection } from "@/components/sections/SelectedWorkSection";
import { SystemsPlayground } from "@/components/sections/SystemsPlayground";
import { AboutSection } from "@/components/sections/AboutSection";
import { ExpertiseSection } from "@/components/sections/ExpertiseSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <>
      <HeroEditorial />
      <TelemetryMarquee />
      <SelectedWorkSection />
      <SystemsPlayground />
      <AboutSection />
      <ExpertiseSection />
      <ExperienceSection />
      <ContactSection />
    </>
  );
}
