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

  // For overdue tasks, lead with "Reschedule" before communication options
  if (insight.type === 'overdue_task') {
    return [
      {
        id: 'update_task',
        label: 'Reschedule this task',
        description: `Change the due date or priority`,
        icon: 'Calendar',
      },
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

  // For no-show patterns (healthcare), offer re-engagement and policy actions
  if (insight.type === 'appointment_no_show') {
    return [
      {
        id: 'draft_email',
        label: 'Send a re-engagement message',
        description: hasEmail
          ? `Email ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
      {
        id: 'draft_sms',
        label: 'Send a reminder text',
        description: hasPhone
          ? `Text ${insight.phone}`
          : 'No phone on file -- you can add one after drafting',
        icon: 'MessageSquare',
      },
      {
        id: 'draft_call_script',
        label: 'Script a call to reschedule',
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

  // For compound risk alerts, offer multi-front action options
  if (insight.type === 'customer_at_risk') {
    const actions: ChoiceOption[] = [
      {
        id: 'draft_email',
        label: 'Send a re-engagement email',
        description: hasEmail
          ? `Email ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
    ];

    // Add "Address the invoice" if there's an overdue invoice
    if (insight.has_overdue_invoice && insight.overdue_invoice_amount && insight.overdue_invoice_amount > 0) {
      actions.push({
        id: 'draft_invoice_followup',
        label: 'Follow up on the overdue invoice',
        description: `$${insight.overdue_invoice_amount.toLocaleString()} outstanding`,
        icon: 'AlertCircle',
      });
    }

    actions.push(
      {
        id: 'draft_call_script',
        label: 'Script a recovery call',
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
        id: 'recovery_plan',
        label: 'Build a full recovery plan',
        description: 'CoPilot drafts a multi-step plan to save this customer',
        icon: 'Briefcase',
      },
      {
        id: 'other',
        label: 'Something else',
        description: 'Tell me what you need',
        icon: 'Pencil',
      },
    );

    return actions;
  }

  // For rate lock expiring (mortgage), offer urgent deal-closing actions
  if (insight.type === 'rate_lock_expiring') {
    return [
      {
        id: 'draft_email',
        label: 'Email client about the lock',
        description: hasEmail
          ? `Send to ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
      {
        id: 'draft_call_script',
        label: 'Script an urgent call',
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
        id: 'draft_sms',
        label: 'Send a quick reminder text',
        description: hasPhone
          ? `Text ${insight.phone}`
          : 'No phone on file -- you can add one after drafting',
        icon: 'MessageSquare',
      },
      {
        id: 'other',
        label: 'Something else',
        description: 'Tell me what you need',
        icon: 'Pencil',
      },
    ];
  }

  // For membership expiring (gyms), offer renewal outreach
  if (insight.type === 'membership_expiring') {
    return [
      {
        id: 'draft_email',
        label: 'Send a renewal email',
        description: hasEmail
          ? `Email ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
      {
        id: 'draft_sms',
        label: 'Text a renewal reminder',
        description: hasPhone
          ? `Text ${insight.phone}`
          : 'No phone on file -- you can add one after drafting',
        icon: 'MessageSquare',
      },
      {
        id: 'draft_call_script',
        label: 'Script a retention call',
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

  // For days on market (real estate), offer strategy actions
  if (insight.type === 'days_on_market') {
    return [
      {
        id: 'draft_email',
        label: 'Email the seller with an update',
        description: hasEmail
          ? `Send to ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
      {
        id: 'draft_call_script',
        label: 'Script a strategy call',
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

  // For filing deadlines (tax), offer client communication and task management
  if (insight.type === 'filing_deadline') {
    return [
      {
        id: 'draft_email',
        label: 'Email client about the deadline',
        description: hasEmail
          ? `Send to ${insight.email}`
          : 'No email on file -- you can add one after drafting',
        icon: 'Mail',
      },
      {
        id: 'draft_sms',
        label: 'Text a deadline reminder',
        description: hasPhone
          ? `Text ${insight.phone}`
          : 'No phone on file -- you can add one after drafting',
        icon: 'MessageSquare',
      },
      {
        id: 'draft_call_script',
        label: 'Script a follow-up call',
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

  // For low stock alerts, offer reorder and inventory actions
  if (insight.type === 'low_stock') {
    return [
      {
        id: 'reorder_email',
        label: 'Draft a reorder email',
        description: hasEmail
          ? `Email ${insight.supplier_name || 'supplier'}`
          : 'No supplier email on file',
        icon: 'Mail',
      },
      {
        id: 'check_inventory',
        label: 'Review inventory levels',
        description: `${insight.product_name} has ${insight.quantity_on_hand} unit${insight.quantity_on_hand === 1 ? '' : 's'}`,
        icon: 'Package',
      },
      {
        id: 'update_threshold',
        label: 'Adjust reorder threshold',
        description: `Current threshold: ${insight.low_stock_threshold} units`,
        icon: 'Settings',
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

    case 'appointment_no_show':
      return `**${insight.customer_name}** has missed **${insight.no_show_count} appointment${(insight.no_show_count || 0) > 1 ? 's' : ''}** in the last 90 days${insight.last_no_show_date ? ` (most recently on ${new Date(insight.last_no_show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : ''}. This is a pattern worth addressing before it leads to churn.\n\nHow would you like to handle this?`;

    case 'customer_at_risk': {
      const signals: string[] = [];
      if (insight.has_stale_deal) signals.push(`a stale deal ($${insight.stale_deal_value?.toLocaleString() || '0'})`);
      if (insight.has_overdue_invoice) signals.push(`$${insight.overdue_invoice_amount?.toLocaleString() || '0'} in overdue invoices`);
      if (insight.overdue_task_count && insight.overdue_task_count > 0) signals.push(`${insight.overdue_task_count} overdue task${insight.overdue_task_count > 1 ? 's' : ''}`);
      if (insight.days_inactive) signals.push(`**${insight.days_inactive} days** since last contact`);
      if (insight.no_recent_emails) signals.push('no outbound emails in the last 30 days');
      const signalText = signals.length > 0 ? signals.join(', ') : 'multiple warning signals';
      return `**${insight.customer_name}** ($${insight.total_spent?.toLocaleString() || '0'} lifetime value) is showing signs of churn risk: ${signalText}. Risk score: **${((insight.risk_score || 0) * 100).toFixed(0)}%**.\n\nThis customer needs a coordinated response. How would you like to start?`;
    }

    case 'rate_lock_expiring':
      return `**${insight.customer_name}**'s rate lock on deal **"${insight.title?.replace('Rate lock expiring - ', '')}"** ($${insight.value?.toLocaleString() || '0'}) expires in **${insight.days_until_expiry} day${insight.days_until_expiry === 1 ? '' : 's'}**. If the lock lapses, the rate could increase and delay closing.\n\nHow would you like to handle this?`;

    case 'membership_expiring':
      return `**${insight.customer_name}**'s membership expires in **${insight.days_until_expiry} day${insight.days_until_expiry === 1 ? '' : 's'}** (${insight.membership_end ? new Date(insight.membership_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}). Lifetime value: **$${insight.total_spent?.toLocaleString() || '0'}**. Reach out now to secure a renewal.\n\nHow would you like to reach out?`;

    case 'days_on_market': {
      const dom = insight.days_on_market || 0;
      return `**"${insight.title?.replace(/ - \d+ days on market/, '')}"** ($${insight.value?.toLocaleString() || '0'}) has been on the market for **${dom} days**${insight.customer_name ? ` for **${insight.customer_name}**` : ''}. Listings over 45 days often need a strategy refresh -- consider a price adjustment, enhanced marketing, or a seller update.\n\nHow would you like to take action?`;
    }

    case 'filing_deadline':
      return `**${insight.customer_name}**'s filing deadline${insight.tax_year ? ` (TY ${insight.tax_year})` : ''} is in **${insight.days_until_deadline} day${insight.days_until_deadline === 1 ? '' : 's'}** (${insight.filing_deadline ? new Date(insight.filing_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}). Make sure all documents are collected and the return is ready to file.\n\nHow would you like to follow up?`;

    case 'low_stock': {
      const stockStatus = insight.quantity_on_hand === 0
        ? 'completely out of stock'
        : `below the reorder threshold of **${insight.low_stock_threshold}**`;
      let intro = `**${insight.product_name}** ${insight.sku ? `(${insight.sku})` : ''} has only **${insight.quantity_on_hand} unit${insight.quantity_on_hand === 1 ? '' : 's'}** remaining, which is ${stockStatus}.`;
      if (insight.supplier_name) {
        intro += ` Your preferred supplier is **${insight.supplier_name}**.`;
      }
      if (insight.reorder_quantity && insight.reorder_quantity > 0) {
        intro += ` Suggested reorder quantity: **${insight.reorder_quantity} units**.`;
      }
      intro += '\n\nHow would you like to handle this?';
      return intro;
    }

    default:
      return `${insight.message}\n\nHow would you like to take action?`;
  }
}
