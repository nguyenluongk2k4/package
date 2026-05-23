import TemplateFrame from "./TemplateFrame";
import {
  HeroSection,
  HowItWorksSection,
  JourneyActionStrip,
  ProofBandSection,
  StationCarouselSection,
  StorySection,
} from "./HomeSections";

export default function HomePage() {
  return (
    <TemplateFrame>
      <HeroSection />
      <JourneyActionStrip />
      <StationCarouselSection />
      <StorySection />
      <ProofBandSection />
      <HowItWorksSection />
    </TemplateFrame>
  );
}
