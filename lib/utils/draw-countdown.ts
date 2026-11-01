/**
 * Draw countdown utilities (v37 - REAL BACKEND null-safe)
 * 
 * Legacy draws have null dates - all helpers handle this gracefully
 */

export interface DrawCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  message: string;
}

/**
 * Calculate countdown to draw date
 * Returns null for legacy draws (null drawDate)
 */
export function getDrawCountdown(drawDate: string | null): DrawCountdown | null {
  if (!drawDate) return null; // Legacy draw - no countdown
  
  const now = new Date();
  const target = new Date(drawDate);
  
  // Invalid date
  if (isNaN(target.getTime())) return null;
  
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      message: "Draw completed",
    };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  let message = "";
  if (days > 0) message = `${days}d ${hours}h`;
  else if (hours > 0) message = `${hours}h ${minutes}m`;
  else if (minutes > 0) message = `${minutes}m ${seconds}s`;
  else message = `${seconds}s`;
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    message,
  };
}

/**
 * Format date range (startsOn - endsOn) as "DD MMM YYYY - DD MMM YYYY"
 * Returns null for legacy draws (null dates)
 */
export function formatDateRange(startsOn: string | null, endsOn: string | null): string | null {
  if (!startsOn || !endsOn) return null; // Legacy draw - no dates
  
  const start = new Date(startsOn);
  const end = new Date(endsOn);
  
  // Invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const endStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Format single draw date
 * Returns null for legacy draws (null drawDate)
 */
export function formatDrawDate(drawDate: string | null): string | null {
  if (!drawDate) return null; // Legacy draw - no draw date
  
  const date = new Date(drawDate);
  
  // Invalid date
  if (isNaN(date.getTime())) return null;
  
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

/**
 * Get nearest upcoming draw from a list
 * Returns null if no draws have valid dates
 */
export function getNearestDraw<T extends { drawDate: string | null; status: string }>(
  draws: T[]
): T | null {
  const now = new Date();
  
  const upcoming = draws
    .filter((draw) => {
      if (!draw.drawDate) return false; // Skip legacy draws
      if (draw.status !== "ACTIVE" && draw.status !== "UPCOMING") return false;
      
      const drawDateObj = new Date(draw.drawDate);
      if (isNaN(drawDateObj.getTime())) return false; // Skip invalid dates
      
      return drawDateObj > now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.drawDate!);
      const dateB = new Date(b.drawDate!);
      return dateA.getTime() - dateB.getTime();
    });
  
  return upcoming[0] || null;
}

/**
 * Get human-friendly countdown message
 * Calendar days in Africa/Lagos timezone
 * 0 days = "today", 1 = "tomorrow", 2-13 = "N days", 14+ = "N weeks"
 */
export function getCountdownMessage(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 13) return `${days} days`;
  
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week" : `${weeks} weeks`;
}

/**
 * Calculate calendar days between now and target date in Africa/Lagos timezone
 */
export function getCalendarDaysUntil(targetDate: string | null): number | null {
  if (!targetDate) return null;
  
  try {
    // Get current date in Africa/Lagos timezone
    const nowInLagos = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" });
    const todayInLagos = new Date(nowInLagos);
    todayInLagos.setHours(0, 0, 0, 0);
    
    // Get target date in Africa/Lagos timezone
    const targetInLagos = new Date(targetDate).toLocaleString("en-US", { timeZone: "Africa/Lagos" });
    const targetDayInLagos = new Date(targetInLagos);
    targetDayInLagos.setHours(0, 0, 0, 0);
    
    const diffMs = targetDayInLagos.getTime() - todayInLagos.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch {
    return null;
  }
}
