import { HeroEditorial } from "@/components/hero/HeroEditorial";
import { SelectedWorkSection } from "@/components/sections/SelectedWorkSection";
import { SystemsPlayground } from "@/components/sections/SystemsPlayground";
import { AboutSection } from "@/components/sections/AboutSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ExpertiseSection } from "@/components/sections/ExpertiseSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <>
      <HeroEditorial />
      <SelectedWorkSection />
      <SystemsPlayground />
      <AboutSection />
      <ExperienceSection />
      <ExpertiseSection />
      <ContactSection />
    </>
  );
}
