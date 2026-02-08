"use client";

import FinalCTASection from "./components/FinalCTASection";
import HeroSection from "./components/HeroSection";
import MiniAuditSection from "./components/MiniAuditSection";
import Navbar from "./components/Navbar";
import PainPointSection from "./components/PainPointSection";
import PillarSection from "./components/PillarSection";
import SocialProofSection from "./components/SocialProofSection";
import SpaceParticles from "./components/SpaceParticles";
import TestimonialsSection from "./components/TestimonialsSection";
import ThreePillarsBridge from "./components/ThreePillarsBridge";



const voiceAgentProps = {
  id: "voice-agents",
  label: "Voice Agents",
  labelColor: "text-[#1E90FF]",
  headline: "You Paid for That Lead.",
  highlightText: "Don't Let Them Walk.",
  highlightColor: "text-[#1E90FF]",
  highlightGlowClass: "text-glow-cyan",
  description: "An AI Voice Agent that picks up every call, qualifies every lead, and books every meeting — instantly.",
  stat: { value: "67%", label: "of customers hang up if they get voicemail" },
  features: [
    { title: "Instant Pickup", description: "Every call answered on the first ring. No voicemail. No missed opportunities." },
    { title: "Natural Objection Handling", description: "Handles pushback with human-like conversation. Creates genuine connection with prospects." },
    { title: "Smart Calendar Booking", description: "Syncs with your calendar. Books meetings automatically. Sends confirmations." },
    { title: "CRM Auto-Logging", description: "Every call logged. Every detail captured. Zero manual data entry." },
  ],
  accentColor: "#1E90FF",
};

const crmProps = {
  id: "custom-crms",
  label: "Custom CRMs",
  labelColor: "text-[#FFD700]",
  headline: "Your Data Shouldn't",
  highlightText: "Live in Five Places.",
  highlightColor: "text-[#FFD700]",
  highlightGlowClass: "text-glow-gold",
  description: "One system built around your process. No more toggling between tools. No more lost context.",
  stat: { value: "23 hrs", label: "wasted per week toggling between tools" },
  features: [
    { title: "Custom Fields for Your Process", description: "Built around how you actually work. Not how some software company thinks you should." },
    { title: "Automated Data Flow", description: "Data moves between systems automatically. No copy-pasting. No human error." },
    { title: "Real-Time Reporting", description: "See what's working and what isn't. Live dashboards. Actionable insights." },
    { title: "Integrates with Everything", description: "Connects to your existing stack. Email, calendar, accounting, marketing — all unified." },
  ],
  accentColor: "#FFD700",
};

const auditProps = {
  id: "ai-audits",
  label: "AI Audits",
  labelColor: "text-emerald-400",
  headline: "You Don't Know",
  highlightText: "What You Don't Know.",
  highlightColor: "text-emerald-400",
  highlightGlowClass: "text-glow-emerald",
  description: "We map every process, find every revenue leak, and deliver your complete automation roadmap.",
  stat: { value: "$180K+", label: "average hidden revenue uncovered per year" },
  features: [
    { title: "Process Inefficiency Mapping", description: "We trace every workflow. Find every bottleneck. Document every manual step." },
    { title: "Revenue Leak Detection", description: "Identify where leads drop off, where data gets lost, and where money disappears." },
    { title: "Automation Roadmap", description: "Prioritized list of what to automate first. Biggest ROI items at the top." },
    { title: "90-Day ROI Projection", description: "Exact numbers on what automation will save you. No guesswork." },
  ],
  accentColor: "#34d399",
};

export default function Home() {
  return (
    <>
      {/* Main Content */}
      <main className="bg-transparent min-h-screen relative">
        {/* Top Navigation */}
        <Navbar />

        {/* Space Particles Background */}
        <SpaceParticles />

        {/* Hero */}
        <HeroSection />

        {/* Pain Point */}
        <PainPointSection />

        {/* Three Pillars Overview */}
        <ThreePillarsBridge />

        {/* Voice Agents Deep Dive */}
        <PillarSection {...voiceAgentProps} />

        {/* Custom CRMs Deep Dive */}
        <PillarSection {...crmProps} />

        {/* AI Audits Deep Dive */}
        <PillarSection {...auditProps} />

        {/* Social Proof */}
        <SocialProofSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Mini AI Audit */}
        <MiniAuditSection />

        {/* Final CTA */}
        <FinalCTASection />

      </main>
    </>
  );
}
