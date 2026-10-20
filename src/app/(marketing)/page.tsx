import { Comparison } from "@/components/marketing/comparison";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PrivacyNotice } from "@/components/marketing/privacy-notice";
import { Sources } from "@/components/marketing/sources";
import { Trust } from "@/components/marketing/trust";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Comparison />
      <Features />
      <Trust />
      <Sources />
      <PrivacyNotice />
    </>
  );
}
