/**
 * Booking Availability Prompt Generator
 *
 * Generates the BOOKING RULES section for Retell voice agent prompts
 * from a user's booking availability configuration.
 *
 * "Booking availability" = when the owner can take meetings (NOT business hours).
 * Example: Owner works a day job, so availability is 7-9 AM + 3-7 PM.
 */

export interface TimeWindow {
  start: string; // "HH:MM" 24h format
  end: string;   // "HH:MM" 24h format
}

export interface BookingAvailability {
  timezone: string;
  meeting_duration_minutes: number;
  meeting_title: string;
  schedule: Record<string, TimeWindow[]>; // empty array = not available that day
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * Convert "HH:MM" to human-readable "H:MM AM/PM"
 */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generate the BOOKING RULES prompt section from booking availability.
 * This text gets injected into the Retell LLM's general_prompt.
 */
export function generateBookingRulesPrompt(availability: BookingAvailability): string {
  const lines: string[] = [
    '## BOOKING RULES',
    `- Default meeting: "${availability.meeting_title}" (${availability.meeting_duration_minutes} min)`,
    `- Timezone: ${availability.timezone}`,
    `- ALWAYS use check_availability before offering times`,
    `- ALWAYS confirm date, time, and purpose before booking`,
    `- Present times in 12-hour format (e.g., "3:00 PM" not "15:00")`,
    '',
    'Available hours for booking:',
  ];

  for (const day of DAY_ORDER) {
    const windows = availability.schedule[day] || [];
    if (windows.length === 0) {
      lines.push(`- ${capitalize(day)}: NOT AVAILABLE`);
    } else {
      const windowStrs = windows.map(w => `${formatTime12h(w.start)}-${formatTime12h(w.end)}`);
      lines.push(`- ${capitalize(day)}: ${windowStrs.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('If caller asks for a time outside these windows, politely explain you are not available at that time and suggest the nearest available window.');

  return lines.join('\n');
}

/**
 * Returns sensible default booking availability for new users.
 * Mon-Fri 9:00-17:00, Sat-Sun not available.
 */
export function getDefaultBookingAvailability(timezone?: string): BookingAvailability {
  const defaultWindow: TimeWindow[] = [{ start: '09:00', end: '17:00' }];
  return {
    timezone: timezone || 'America/Chicago',
    meeting_duration_minutes: 30,
    meeting_title: 'Meeting',
    schedule: {
      monday: [...defaultWindow],
      tuesday: [...defaultWindow],
      wednesday: [...defaultWindow],
      thursday: [...defaultWindow],
      friday: [...defaultWindow],
      saturday: [],
      sunday: [],
    },
  };
}

/**
 * Common timezone options for North America (primary market).
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Toronto', label: 'Eastern - Toronto' },
  { value: 'America/Winnipeg', label: 'Central - Winnipeg' },
  { value: 'America/Edmonton', label: 'Mountain - Edmonton' },
  { value: 'America/Vancouver', label: 'Pacific - Vancouver' },
  { value: 'America/Halifax', label: 'Atlantic (AT)' },
  { value: 'America/St_Johns', label: 'Newfoundland (NT)' },
  { value: 'America/Regina', label: 'Saskatchewan (no DST)' },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
] as const;
