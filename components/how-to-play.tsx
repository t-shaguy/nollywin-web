/**
 * How to Play Component
 * 
 * Collapsible accordion that explains the game flow.
 * - Open by default for users with no plan
 * - Closed by default for users with an active plan
 * - State persisted in localStorage
 */

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Package, Gamepad2, Trophy, Gift } from "lucide-react";
import { HOW_TO_PLAY_STEPS } from "@/lib/content/how-to-play";

const ICONS = [Package, Gamepad2, Trophy, Gift];

interface HowToPlayProps {
  hasActiveSubscription: boolean;
}

export function HowToPlay({ hasActiveSubscription }: HowToPlayProps) {
  // Default open state based on subscription status
  const defaultOpen = !hasActiveSubscription;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved state from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nollywin:how-to-play-open");
      if (saved !== null) {
        setIsOpen(saved === "true");
      }
    } catch (err) {
      console.warn("Failed to load How to Play state:", err);
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage when it changes
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    try {
      localStorage.setItem("nollywin:how-to-play-open", String(newState));
    } catch (err) {
      console.warn("Failed to save How to Play state:", err);
    }
  };

  // Avoid hydration mismatch by not rendering until client-side state is loaded
  if (!isHydrated) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-secondary/30 transition-colors min-h-[60px]"
        aria-expanded={isOpen}
      >
        <h2 className="text-base sm:text-lg font-semibold">How to play</h2>
        <ChevronDown
          size={20}
          className={`text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {/* Desktop: 4 columns */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4">
            {HOW_TO_PLAY_STEPS.map((step, index) => {
              const Icon = ICONS[index];
              return (
                <div key={index} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    {step.linkText && step.linkHref && (
                      <Link
                        href={step.linkHref}
                        className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {step.linkText} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet: 2x2 grid */}
          <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-4">
            {HOW_TO_PLAY_STEPS.map((step, index) => {
              const Icon = ICONS[index];
              return (
                <div key={index} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    {step.linkText && step.linkHref && (
                      <Link
                        href={step.linkHref}
                        className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {step.linkText} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Stacked */}
          <div className="md:hidden space-y-4">
            {HOW_TO_PLAY_STEPS.map((step, index) => {
              const Icon = ICONS[index];
              return (
                <div key={index} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    {step.linkText && step.linkHref && (
                      <Link
                        href={step.linkHref}
                        className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {step.linkText} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
