/**
 * Utility functions for time calculations
 */

/**
 * Parse time string (e.g., "30d", "15m", "2h") to milliseconds
 * @param timeString - Time string in format "number + unit" (d=days, h=hours, m=minutes, s=seconds)
 * @returns Time in milliseconds
 */
export function parseTimeString(timeString: string): number {
  const match = timeString.match(/^(\d+)([dhms])$/);
  if (match && match[1] && match[2]) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000; // 30 days default
    }
  }
  return 30 * 24 * 60 * 60 * 1000; // 30 days default
}
