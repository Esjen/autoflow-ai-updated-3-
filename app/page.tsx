import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Workflow from "@/components/landing/Workflow";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

export default function Home() {
  return (
    <main className="overflow-x-hidden pt-24">
      <Navbar />
      <FadeIn>
        <Hero />
      </FadeIn>
      
      <SocialProof />
      <Workflow />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}