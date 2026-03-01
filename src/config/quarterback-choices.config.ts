/**
 * Quarterback Choice Configuration
 *
 * Builds the deterministic choice options and intro messages
 * shown in CoPilot when a user clicks a Quarterback insight.
 * No AI tokens are consumed for this step.
 */
import type { ChoiceOption } from '@/types/copilot-actions.types';
import type { QuarterbackInsight } from '@/hooks/useQuarterbackInsights';

/**
 * Build the choice options for a Quarterback insight.
 * Phone/call option is plan-gated (elite_premium+ for full access).
 */
export function buildQuarterbackChoices(
  insight: QuarterbackInsight,
  planTier: string
): ChoiceOption[] {
  const hasEmail = !!insight.email;
  const hasPhone = !!insight.phone;
  const isCallTierEligible = planTier === 'elite_premium' || planTier === 'enterprise';

  // For upcoming meetings, offer meeting prep actions
  if (insight.type === 'upcoming_meeting') {
    const hasAttendees = insight.meeting_attendees && insight.meeting_attendees.length > 0;
    const hasCompanyDomains = insight.meeting_company_domains && insight.meeting_company_domains.length > 0;

    return [
      {
        id: 'meeting_research',
        label: 'Research attendees',
        description: hasCompanyDomains
          ? `Look up ${insight.meeting_company_domains!.map(d => d.companyName).join(', ')}`
          : hasAttendees
            ? `Look up ${insight.meeting_attendees![0]?.name || 'attendees'}`
            : 'Research who you are meeting with',
        icon: 'Globe',
      },
      {
        id: 'meeting_agenda',
        label: 'Prepare a meeting agenda',
        description: insight.meeting_description
          ? 'Based on meeting details and past interactions'
          : 'Generate a professional agenda',
        icon: 'BookOpen',
      },
      {
        id: 'meeting_prep_notes',
        label: 'Draft prep notes',
        description: insight.customer_name
          ? `Review your history with ${insight.customer_name}`
          : 'Summarize what you know about the attendees',
        icon: 'Briefcase',
      },
      {
        id: 'meeting_ask_questions',
        label: 'Help me prepare',
        description: 'CoPilot asks you questions to get you ready',
        icon: 'MessageSquare',
      },
    ];
  }

  // For incoming emails, the primary action is "Draft a reply"
  if (insight.type === 'new_email_received') {
    return [
      {
        id: 'draft_email',
        label: 'Draft a reply',
        description: hasEmail
          ? `Reply to ${insight.email}`
          : 'Draft a response to this email',
        icon: 'Reply',
      },
      {
        id: 'draft_sms',
        label: 'Text them instead',
        description: hasPhone
          ? `Text ${insight.phone}`
          : 'No phone on file -- you can add one after drafting',
        icon: 'MessageSquare',
      },
      {
        id: 'draft_call_script',
        label: 'Script a call back',
        description: isCallTierEligible
          ? (hasPhone ? `Call ${insight.phone}` : 'No phone on file')
          : 'Upgrade to Elite Premium for outbound calling',
        icon: 'Phone',
        disabled: !isCallTierEligible,
        disabledReason: !isCallTierEligible
          ? 'Available on Elite Premium and Enterprise plans'
          : undefined,
      },
      {
        id: 'other',
        label: 'Something else',
        description: 'Tell me what you need',
        icon: 'Pencil',
      },
    ];
  }

  return [
    {
      id: 'draft_email',
      label: 'Draft a follow-up email',
      description: hasEmail
        ? `Send to ${insight.email}`
        : 'No email on file -- you can add one after drafting',
      icon: 'Mail',
    },
    {
      id: 'draft_sms',
      label: 'Draft a quick text',
      description: hasPhone
        ? `Text ${insight.phone}`
        : 'No phone on file -- you can add one after drafting',
      icon: 'MessageSquare',
    },
    {
      id: 'draft_call_script',
      label: 'Script an outgoing call',
      description: isCallTierEligible
        ? (hasPhone ? `Call ${insight.phone}` : 'No phone on file')
        : 'Upgrade to Elite Premium for outbound calling',
      icon: 'Phone',
      disabled: !isCallTierEligible,
      disabledReason: !isCallTierEligible
        ? 'Available on Elite Premium and Enterprise plans'
        : undefined,
    },
    {
      id: 'other',
      label: 'Something else',
      description: 'Tell me what you need',
      icon: 'Pencil',
    },
  ];
}

/**
 * Build the contextual intro message for each insight type.
 * Shown above the choices in the CoPilot panel.
 */
export function buildQuarterbackIntro(insight: QuarterbackInsight): string {
  switch (insight.type) {
    case 'inactive_customer':
      return `**${insight.customer_name}** hasn't been contacted in **${insight.days_inactive} days** and has a lifetime value of **$${insight.total_spent?.toLocaleString() || '0'}**. This is a re-engagement opportunity you don't want to miss.\n\nHow would you like to reach out?`;

    case 'stale_deal':
      return `The deal **"${insight.title}"** for **${insight.customer_name}** ($${insight.value?.toLocaleString() || '0'}) has been sitting in "${insight.stage}" for **${insight.days_stale} days** without movement. Time to push it forward.\n\nHow would you like to re-engage?`;

    case 'overdue_task':
      return `Task **"${insight.title}"** for **${insight.customer_name || 'unassigned'}** is **${insight.days_overdue} days overdue** (${insight.priority} priority). Let's get this handled.\n\nHow would you like to follow up?`;

    case 'expiring_quote':
      return `Quote **"${insight.title}"** for **${insight.customer_name}** ($${insight.total_amount?.toLocaleString() || '0'}) expires in **${insight.days_until_expiry} days**. Act now before it lapses.\n\nHow would you like to follow up?`;

    case 'overdue_invoice':
      return `Invoice **"${insight.title}"** for **${insight.customer_name}** has **$${insight.amount_outstanding?.toLocaleString() || '0'}** outstanding and is **${insight.days_overdue} days overdue**. Time to collect.\n\nHow would you like to reach out?`;

    case 'follow_up_reminder':
      return `Follow-up with **${insight.customer_name}** was ${insight.days_past_followup === 0 ? 'due today' : `due **${insight.days_past_followup} days ago**`}. Don't let this slip.\n\nHow would you like to follow up?`;

    case 'new_email_received': {
      const receivedAt = insight.email_received_at ? new Date(insight.email_received_at) : null;
      const hoursAgo = receivedAt ? Math.round((Date.now() - receivedAt.getTime()) / (1000 * 60 * 60)) : 0;
      const timeLabel = hoursAgo < 1 ? 'just now' : hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
      return `**${insight.customer_name}** sent you an email **"${insight.email_subject || insight.title}"** ${timeLabel}. No reply has been sent yet -- don't leave them waiting.\n\nHow would you like to respond?`;
    }

    case 'upcoming_meeting': {
      const startDate = insight.meeting_start_time ? new Date(insight.meeting_start_time) : null;
      const hoursUntil = startDate
        ? Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60))
        : 0;
      const meetingTimeLabel = hoursUntil < 1 ? 'less than an hour'
        : hoursUntil === 1 ? '1 hour'
        : hoursUntil < 24 ? `${hoursUntil} hours`
        : 'tomorrow';

      let intro = `Your meeting **"${insight.meeting_title}"** is in **${meetingTimeLabel}**`;

      // Add attendee context
      const attendees = insight.meeting_attendees || [];
      if (attendees.length > 0) {
        const names = attendees.slice(0, 3).map(a => a.name || a.email).join(', ');
        intro += ` with ${names}`;
        if (attendees.length > 3) intro += ` and ${attendees.length - 3} others`;
      }
      intro += '.';

      // Add company context
      const domains = insight.meeting_company_domains || [];
      if (domains.length > 0) {
        intro += ` They're from **${domains.map(d => d.companyName).join(', ')}**.`;
      }

      // Add customer relationship context if available
      if (insight.customer_name && insight.total_spent) {
        intro += ` **${insight.customer_name}** has a lifetime value of **$${insight.total_spent.toLocaleString()}** with you.`;
      }

      intro += '\n\nHow would you like to prepare?';
      return intro;
    }

    default:
      return `${insight.message}\n\nHow would you like to take action?`;
  }
}
