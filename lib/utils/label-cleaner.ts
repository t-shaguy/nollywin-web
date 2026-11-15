/**
 * Clean backend resource types and labels for display
 * Removes "Raffle" terminology while preserving API compatibility
 */

export function cleanLabel(text: string | null | undefined): string {
  if (!text) return "";
  
  // Replace "RaffleDraw" with "Draw"
  let cleaned = text.replace(/RaffleDraw/g, "Draw");
  
  // Replace "RaffleWinner" with "Winner"
  cleaned = cleaned.replace(/RaffleWinner/g, "Winner");
  
  // Replace "raffle draw" / "Raffle Draw" / "RAFFLE DRAW" with "draw" / "Draw" / "DRAW"
  cleaned = cleaned.replace(/raffle\s+draw/gi, (match) => {
    if (match === match.toUpperCase()) return "DRAW";
    if (match[0] === match[0].toUpperCase()) return "Draw";
    return "draw";
  });
  
  // Replace remaining "raffle" / "Raffle" / "RAFFLE" with "draw" / "Draw" / "DRAW"
  cleaned = cleaned.replace(/raffles?/gi, (match) => {
    const isPlural = match.toLowerCase().endsWith('s');
    if (match === match.toUpperCase()) {
      return isPlural ? "DRAWS" : "DRAW";
    }
    if (match[0] === match[0].toUpperCase()) {
      return isPlural ? "Draws" : "Draw";
    }
    return isPlural ? "draws" : "draw";
  });
  
  // Fix any accidental doubles: "draw draw" → "draw"
  cleaned = cleaned.replace(/\b(draw|Draw|DRAW)\s+\1\b/gi, "$1");
  
  return cleaned;
}

/**
 * Clean resource type for display in change requests and notifications
 */
export function cleanResourceType(resourceType: string): string {
  if (resourceType.toLowerCase() === 'raffledraw') return 'Draw';
  if (resourceType.toLowerCase() === 'rafflewinner') return 'Winner';
  return resourceType;
}
