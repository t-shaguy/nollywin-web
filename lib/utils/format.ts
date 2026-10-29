/**
 * Admin formatting utilities
 */

// Pluralize words correctly
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

// Format Nigerian Naira with proper symbol and separators
const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount).replace('NGN', '₦');
}

// Format numbers with thousand separators
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Humanize PascalCase/camelCase resource names
export function humanizeResourceType(resourceType: string): string {
  // Insert space before capital letters, then title case
  return resourceType
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Format dates consistently (DD MMM YYYY)
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(d);
}

// Format timestamp with Africa/Lagos timezone
export function formatTimestamp(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Generate stable color from string (for avatar initials)
const avatarColors = [
  'oklch(0.65 0.18 250)', // blue
  'oklch(0.7 0.15 145)', // green
  'oklch(0.75 0.15 85)', // amber
  'oklch(0.65 0.18 300)', // purple
  'oklch(0.65 0.18 50)', // orange
];

export function getAvatarColor(str: string): string {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Get initials from email or name
export function getInitials(email: string): string {
  if (!email || email.trim() === '') return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}
