/**
 * How to Play Content
 * 
 * Centralized content for the "How to Play" section.
 * Product team can edit this file to update copy without touching component code.
 */

export interface HowToPlayStep {
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
}

export const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    title: "Get a package",
    description: "Choose a Daily, Weekly or Monthly package on the Packages page.",
    linkText: "View packages",
    linkHref: "/store",
  },
  {
    title: "Play trivia",
    description: "Each game uses 1 token. Answer every question before the timer runs out.",
  },
  {
    title: "Earn points",
    description: "Correct answers earn points. Your points count toward the monthly leaderboard.",
  },
  {
    title: "Win prizes",
    description: "Points you earn while a draw is running count toward that draw. The top players win when it ends.",
  },
];
