"use client";

import { useState } from "react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { HeroSection } from "@/components/HeroSection";
import { ActionButtons } from "@/components/ActionButtons";
import { Footer } from "@/components/Footer";
import { HowToPlayModal } from "@/components/HowToPlayModal";

export default function HomePage() {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center bg-surreal-grid overflow-hidden">
      {/* Background Decorative Layer */}
      <SurrealDecorations />

      {/* Main Content Area (Mobile First Container) */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between max-w-md mx-auto py-2">
        {/* Top Hero Section */}
        <HeroSection />

        {/* Center Action Buttons */}
        <ActionButtons />

        {/* Bottom Footer Section */}
        <Footer onOpenHowToPlay={() => setIsHowToPlayOpen(true)} />
      </div>

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </main>
  );
}
