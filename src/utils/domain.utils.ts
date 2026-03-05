/**
 * Domain Extraction Utility
 * Extracts company domains from email addresses, filtering personal/freemail providers.
 * Used by AI Quarterback meeting insights for attendee enrichment.
 */

// Comprehensive set of personal/freemail/ISP domains to skip
const PERSONAL_EMAIL_DOMAINS = new Set([
  // Major global providers
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'msn.com', 'yahoo.com', 'yahoo.ca', 'yahoo.co.uk', 'yahoo.co.in',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'tutanota.com', 'zoho.com',
  'mail.com', 'email.com', 'fastmail.com', 'yandex.com', 'yandex.ru',
  // Canadian ISPs
  'rogers.com', 'bell.net', 'bellnet.ca', 'sympatico.ca', 'telus.net',
  'shaw.ca', 'cogeco.ca', 'eastlink.ca', 'videotron.ca', 'sasktel.net',
  // US ISPs
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net',
  'charter.net', 'earthlink.net', 'frontier.com',
  // Others
  'gmx.com', 'gmx.net', 'web.de', 'outlook.co.uk', 'live.co.uk',
  'btinternet.com', 'sky.com', 'virginmedia.com',
]);

export interface ExtractedDomain {
  domain: string;
  isPersonal: boolean;
  companyName: string | null;
}

/**
 * Extract company domain from an email address.
 * Returns null if email is invalid.
 * Returns { isPersonal: true } for freemail/ISP domains.
 */
export function extractDomainFromEmail(email: string): ExtractedDomain | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex < 1) return null;

  const domain = trimmed.slice(atIndex + 1);
  if (!domain || !domain.includes('.')) return null;

  const isPersonal = PERSONAL_EMAIL_DOMAINS.has(domain);

  // Derive display name from domain (e.g., "acmecorp.com" -> "Acmecorp")
  const companyName = isPersonal
    ? null
    : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  return { domain, isPersonal, companyName };
}

/**
 * Extract unique company domains from a list of attendee emails.
 * Filters out personal domains and deduplicates.
 */
export function extractCompanyDomains(
  attendees: Array<{ email: string; name?: string }>
): Array<{ domain: string; companyName: string; attendeeNames: string[] }> {
  const domainMap = new Map<string, { companyName: string; attendeeNames: string[] }>();

  for (const attendee of attendees) {
    if (!attendee.email) continue;
    const extracted = extractDomainFromEmail(attendee.email);
    if (!extracted || extracted.isPersonal) continue;

    const existing = domainMap.get(extracted.domain);
    if (existing) {
      if (attendee.name) existing.attendeeNames.push(attendee.name);
    } else {
      domainMap.set(extracted.domain, {
        companyName: extracted.companyName || extracted.domain,
        attendeeNames: attendee.name ? [attendee.name] : [],
      });
    }
  }

  return Array.from(domainMap.entries()).map(([domain, info]) => ({
    domain,
    ...info,
  }));
}
