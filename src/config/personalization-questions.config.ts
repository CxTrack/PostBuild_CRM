/**
 * Personalization Interview Question Configuration
 *
 * Builds deterministic questions with structured choice cards
 * for the voice agent personalization interview.
 * No AI tokens are consumed during the interview -- only at the
 * end when generating the final ACTION_PROPOSAL.
 *
 * Follows the same pattern as quarterback-choices.config.ts.
 */
import type { ChoicesConfig } from '@/types/copilot-actions.types';

export interface PersonalizationQuestion {
  id: string;
  fieldKey: string;
  text: string;
  choicesConfig: ChoicesConfig;
  /** Template for instant acknowledgment when user picks a predefined option.
   *  Use {answer} as placeholder for the selected label(s). */
  acknowledgmentTemplate?: string;
  /** When true, the edge function may return AI-adapted options for this question
   *  based on website context or accumulated answers. Falls back to static options. */
  isAdaptive?: boolean;
}

// Industry-specific service options
const INDUSTRY_SERVICES: Record<string, Array<{ id: string; label: string; description: string; icon: string }>> = {
  tax_accounting: [
    { id: 'tax_prep', label: 'Tax Preparation', description: 'Individual and business returns', icon: 'Calculator' },
    { id: 'bookkeeping', label: 'Bookkeeping', description: 'Monthly reconciliation and reporting', icon: 'BookOpen' },
    { id: 'payroll', label: 'Payroll Services', description: 'Employee payroll processing', icon: 'DollarSign' },
    { id: 'advisory', label: 'Business Advisory', description: 'Strategic financial guidance', icon: 'TrendingUp' },
    { id: 'estate', label: 'Estate Planning', description: 'Trusts, wills, and succession', icon: 'Shield' },
    { id: 'audit', label: 'Audit Support', description: 'Audit preparation and defense', icon: 'Scale' },
  ],
  healthcare: [
    { id: 'general', label: 'General Practice', description: 'Primary care visits', icon: 'Heart' },
    { id: 'specialist', label: 'Specialist Referrals', description: 'Connect with specialists', icon: 'Briefcase' },
    { id: 'lab', label: 'Lab Work', description: 'Blood tests and diagnostics', icon: 'Calculator' },
    { id: 'prescriptions', label: 'Prescription Management', description: 'Refills and medication', icon: 'Shield' },
    { id: 'preventive', label: 'Preventive Care', description: 'Checkups and screenings', icon: 'Heart' },
    { id: 'telehealth', label: 'Telehealth', description: 'Virtual appointments', icon: 'Globe' },
  ],
  real_estate: [
    { id: 'residential', label: 'Residential Sales', description: 'Buy and sell homes', icon: 'Building2' },
    { id: 'commercial', label: 'Commercial Sales', description: 'Office and retail space', icon: 'Building2' },
    { id: 'property_mgmt', label: 'Property Management', description: 'Tenant and maintenance', icon: 'Wrench' },
    { id: 'market', label: 'Market Analysis', description: 'Pricing and comparables', icon: 'TrendingUp' },
    { id: 'rentals', label: 'Rental Listings', description: 'Lease and rental properties', icon: 'DollarSign' },
    { id: 'investment', label: 'Investment Advisory', description: 'ROI and portfolio guidance', icon: 'TrendingUp' },
  ],
  contractors_home_services: [
    { id: 'renovations', label: 'Renovations', description: 'Kitchen, bath, whole-home', icon: 'Wrench' },
    { id: 'repairs', label: 'Repairs', description: 'Fix and maintenance work', icon: 'Wrench' },
    { id: 'new_construction', label: 'New Construction', description: 'Ground-up builds', icon: 'Building2' },
    { id: 'inspections', label: 'Inspections', description: 'Home and safety inspections', icon: 'Shield' },
    { id: 'maintenance', label: 'Maintenance Plans', description: 'Ongoing service contracts', icon: 'Clock' },
    { id: 'emergency', label: 'Emergency Service', description: '24/7 urgent repairs', icon: 'Shield' },
  ],
  mortgage_broker: [
    { id: 'prequal', label: 'Pre-Qualification', description: 'Assess borrowing power', icon: 'Calculator' },
    { id: 'refinance', label: 'Refinancing', description: 'Better rates and terms', icon: 'TrendingUp' },
    { id: 'purchase', label: 'Home Purchase Loans', description: 'First-time and repeat buyers', icon: 'Building2' },
    { id: 'commercial', label: 'Commercial Mortgages', description: 'Business property financing', icon: 'Building2' },
    { id: 'rates', label: 'Rate Comparison', description: 'Shop across lenders', icon: 'DollarSign' },
    { id: 'consolidation', label: 'Debt Consolidation', description: 'Combine and simplify', icon: 'Scale' },
  ],
  legal_services: [
    { id: 'consultations', label: 'Consultations', description: 'Initial case review', icon: 'Briefcase' },
    { id: 'contracts', label: 'Contract Review', description: 'Draft and review agreements', icon: 'BookOpen' },
    { id: 'litigation', label: 'Litigation', description: 'Court representation', icon: 'Scale' },
    { id: 'estate', label: 'Estate Planning', description: 'Wills, trusts, power of attorney', icon: 'Shield' },
    { id: 'business', label: 'Business Formation', description: 'Incorporation and setup', icon: 'Building2' },
    { id: 'mediation', label: 'Mediation', description: 'Dispute resolution', icon: 'Heart' },
  ],
  gyms_fitness: [
    { id: 'membership', label: 'Gym Membership', description: 'Join and membership options', icon: 'Heart' },
    { id: 'personal_training', label: 'Personal Training', description: 'One-on-one coaching', icon: 'TrendingUp' },
    { id: 'classes', label: 'Group Classes', description: 'Yoga, spin, HIIT, etc.', icon: 'Heart' },
    { id: 'nutrition', label: 'Nutrition Coaching', description: 'Meal plans and guidance', icon: 'BookOpen' },
    { id: 'youth', label: 'Youth Programs', description: 'Kids and teen fitness', icon: 'Heart' },
    { id: 'corporate', label: 'Corporate Wellness', description: 'Company wellness programs', icon: 'Building2' },
  ],
  construction: [
    { id: 'residential', label: 'Residential Construction', description: 'Homes and renovations', icon: 'Building2' },
    { id: 'commercial', label: 'Commercial Construction', description: 'Office and retail builds', icon: 'Building2' },
    { id: 'project_mgmt', label: 'Project Management', description: 'Timeline and coordination', icon: 'Clock' },
    { id: 'design_build', label: 'Design-Build', description: 'Full design and construction', icon: 'Wrench' },
    { id: 'permits', label: 'Permit Coordination', description: 'Building permits and codes', icon: 'Shield' },
    { id: 'inspections', label: 'Site Inspections', description: 'Progress and safety checks', icon: 'Shield' },
  ],
  agency: [
    { id: 'web_dev', label: 'Web Development', description: 'Sites, apps, and platforms', icon: 'Globe' },
    { id: 'branding', label: 'Branding & Design', description: 'Logo, identity, collateral', icon: 'Briefcase' },
    { id: 'marketing', label: 'Digital Marketing', description: 'Ads, funnels, campaigns', icon: 'TrendingUp' },
    { id: 'content', label: 'Content Creation', description: 'Blog, video, social content', icon: 'BookOpen' },
    { id: 'seo', label: 'SEO/SEM', description: 'Search optimization', icon: 'Globe' },
    { id: 'social', label: 'Social Media Management', description: 'Posting and engagement', icon: 'Heart' },
  ],
  distribution_logistics: [
    { id: 'fulfillment', label: 'Order Fulfillment', description: 'Pick, pack, and ship', icon: 'Wrench' },
    { id: 'warehousing', label: 'Warehousing', description: 'Storage and inventory', icon: 'Building2' },
    { id: 'freight', label: 'Freight Shipping', description: 'LTL and FTL transport', icon: 'Globe' },
    { id: 'returns', label: 'Returns Processing', description: 'RMA and exchanges', icon: 'Scale' },
    { id: 'inventory', label: 'Inventory Management', description: 'Stock tracking and alerts', icon: 'Calculator' },
    { id: 'packaging', label: 'Custom Packaging', description: 'Branded and special packaging', icon: 'Wrench' },
  ],
  general_business: [
    { id: 'consulting', label: 'Consulting', description: 'Expert advisory services', icon: 'Briefcase' },
    { id: 'support', label: 'Customer Support', description: 'Help desk and service', icon: 'Heart' },
    { id: 'sales', label: 'Product Sales', description: 'Selling goods or services', icon: 'DollarSign' },
    { id: 'delivery', label: 'Service Delivery', description: 'Providing core services', icon: 'Wrench' },
    { id: 'training', label: 'Training', description: 'Education and workshops', icon: 'BookOpen' },
    { id: 'account_mgmt', label: 'Account Management', description: 'Client relationship management', icon: 'Briefcase' },
  ],
};

// Industry-specific call reasons
const INDUSTRY_CALL_REASONS: Record<string, Array<{ id: string; label: string; description: string; icon: string }>> = {
  tax_accounting: [
    { id: 'filing', label: 'Tax Filing Questions', description: 'Deadlines and requirements', icon: 'Calculator' },
    { id: 'appointment', label: 'Appointment Scheduling', description: 'Book a meeting', icon: 'Clock' },
    { id: 'documents', label: 'Document Drop-off', description: 'Bring or send documents', icon: 'BookOpen' },
    { id: 'payment', label: 'Payment Inquiry', description: 'Billing and payment status', icon: 'DollarSign' },
    { id: 'extension', label: 'Tax Extension', description: 'Filing deadline extension', icon: 'Clock' },
    { id: 'onboarding', label: 'New Client Onboarding', description: 'Getting started as a client', icon: 'Briefcase' },
  ],
  healthcare: [
    { id: 'book_appointment', label: 'Book Appointment', description: 'Schedule a visit', icon: 'Clock' },
    { id: 'prescription', label: 'Prescription Refill', description: 'Medication refills', icon: 'Shield' },
    { id: 'insurance', label: 'Insurance Verification', description: 'Coverage and eligibility', icon: 'DollarSign' },
    { id: 'results', label: 'Test Results', description: 'Lab and imaging results', icon: 'BookOpen' },
    { id: 'billing', label: 'Billing Question', description: 'Charges and payments', icon: 'DollarSign' },
    { id: 'referral', label: 'Referral Request', description: 'Specialist referrals', icon: 'Briefcase' },
  ],
  real_estate: [
    { id: 'viewing', label: 'Property Viewing', description: 'Schedule a showing', icon: 'Building2' },
    { id: 'listing', label: 'Listing Inquiry', description: 'Ask about a property', icon: 'BookOpen' },
    { id: 'estimate', label: 'Price Estimate', description: 'Market value assessment', icon: 'DollarSign' },
    { id: 'offer', label: 'Offer Status', description: 'Check on submitted offer', icon: 'TrendingUp' },
    { id: 'closing', label: 'Closing Timeline', description: 'Transaction progress', icon: 'Clock' },
    { id: 'mortgage', label: 'Mortgage Referral', description: 'Financing options', icon: 'DollarSign' },
  ],
  contractors_home_services: [
    { id: 'quote', label: 'Get a Quote', description: 'Pricing for a job', icon: 'DollarSign' },
    { id: 'schedule', label: 'Schedule Service', description: 'Book a service call', icon: 'Clock' },
    { id: 'emergency', label: 'Emergency Repair', description: 'Urgent service needed', icon: 'Shield' },
    { id: 'update', label: 'Project Update', description: 'Status on current work', icon: 'TrendingUp' },
    { id: 'warranty', label: 'Warranty Claim', description: 'Coverage and repairs', icon: 'Shield' },
    { id: 'payment', label: 'Payment Question', description: 'Invoices and billing', icon: 'DollarSign' },
  ],
  mortgage_broker: [
    { id: 'rates', label: 'Rate Inquiry', description: 'Current mortgage rates', icon: 'DollarSign' },
    { id: 'application', label: 'Application Status', description: 'Check your application', icon: 'TrendingUp' },
    { id: 'documents', label: 'Document Submission', description: 'Send required paperwork', icon: 'BookOpen' },
    { id: 'preapproval', label: 'Pre-Approval', description: 'Get pre-approved', icon: 'Calculator' },
    { id: 'payment', label: 'Payment Question', description: 'Billing and escrow', icon: 'DollarSign' },
    { id: 'refinance', label: 'Refinance Options', description: 'Lower your rate', icon: 'TrendingUp' },
  ],
  legal_services: [
    { id: 'consultation', label: 'Schedule Consultation', description: 'Initial case meeting', icon: 'Clock' },
    { id: 'case_update', label: 'Case Update', description: 'Status of your case', icon: 'TrendingUp' },
    { id: 'documents', label: 'Document Request', description: 'File or request documents', icon: 'BookOpen' },
    { id: 'billing', label: 'Billing Inquiry', description: 'Fees and payment', icon: 'DollarSign' },
    { id: 'court', label: 'Court Date Info', description: 'Hearing dates and prep', icon: 'Scale' },
    { id: 'retainer', label: 'Retainer Question', description: 'Retainer balance and terms', icon: 'DollarSign' },
  ],
  gyms_fitness: [
    { id: 'membership', label: 'Membership Inquiry', description: 'Plans and pricing', icon: 'DollarSign' },
    { id: 'schedule', label: 'Class Schedule', description: 'Times and availability', icon: 'Clock' },
    { id: 'cancel', label: 'Cancel/Freeze Account', description: 'Pause or end membership', icon: 'Shield' },
    { id: 'training', label: 'Personal Training', description: 'Book a trainer', icon: 'TrendingUp' },
    { id: 'tour', label: 'Tour Request', description: 'Visit the facility', icon: 'Building2' },
    { id: 'billing', label: 'Billing Question', description: 'Charges and payments', icon: 'DollarSign' },
  ],
  construction: [
    { id: 'quote', label: 'Project Quote', description: 'Bid on a new project', icon: 'DollarSign' },
    { id: 'timeline', label: 'Timeline Update', description: 'Project schedule status', icon: 'Clock' },
    { id: 'permit', label: 'Permit Status', description: 'Building permits progress', icon: 'Shield' },
    { id: 'change_order', label: 'Change Order', description: 'Scope modifications', icon: 'BookOpen' },
    { id: 'inspection', label: 'Inspection Schedule', description: 'Safety and progress checks', icon: 'Shield' },
    { id: 'draw', label: 'Payment/Draw Request', description: 'Progress billing', icon: 'DollarSign' },
  ],
  agency: [
    { id: 'intake', label: 'Project Intake', description: 'Start a new project', icon: 'Briefcase' },
    { id: 'status', label: 'Status Update', description: 'Current project progress', icon: 'TrendingUp' },
    { id: 'review', label: 'Creative Review', description: 'Review deliverables', icon: 'BookOpen' },
    { id: 'scope', label: 'Scope Change', description: 'Modify project scope', icon: 'Wrench' },
    { id: 'billing', label: 'Billing Question', description: 'Invoices and payment', icon: 'DollarSign' },
    { id: 'strategy', label: 'Strategy Session', description: 'Planning and roadmap', icon: 'TrendingUp' },
  ],
  distribution_logistics: [
    { id: 'order_status', label: 'Order Status', description: 'Track shipments', icon: 'TrendingUp' },
    { id: 'shipping', label: 'Shipping Inquiry', description: 'Rates and options', icon: 'Globe' },
    { id: 'returns', label: 'Return/Exchange', description: 'RMA and returns', icon: 'Scale' },
    { id: 'account', label: 'Account Setup', description: 'New account onboarding', icon: 'Briefcase' },
    { id: 'pricing', label: 'Pricing Request', description: 'Quotes and volume pricing', icon: 'DollarSign' },
    { id: 'delivery', label: 'Delivery Issue', description: 'Missing or damaged goods', icon: 'Shield' },
  ],
  general_business: [
    { id: 'inquiry', label: 'General Inquiry', description: 'Questions about services', icon: 'Briefcase' },
    { id: 'appointment', label: 'Schedule Appointment', description: 'Book a meeting', icon: 'Clock' },
    { id: 'pricing', label: 'Pricing Question', description: 'Rates and packages', icon: 'DollarSign' },
    { id: 'support', label: 'Support Request', description: 'Help with an issue', icon: 'Heart' },
    { id: 'account', label: 'Account Question', description: 'Account access or info', icon: 'Briefcase' },
    { id: 'billing', label: 'Billing Issue', description: 'Charges and payments', icon: 'DollarSign' },
  ],
};

// Industry-specific agent goals
const INDUSTRY_AGENT_GOALS: Record<string, Array<{ id: string; label: string; description: string; icon: string }>> = {
  tax_accounting: [
    { id: 'book_appointments', label: 'Book Appointments', description: 'Schedule consultations and tax prep sessions', icon: 'Clock' },
    { id: 'collect_info', label: 'Collect Contact Info', description: 'Gather caller details for team follow-up', icon: 'Briefcase' },
    { id: 'answer_questions', label: 'Answer Tax Questions', description: 'Provide general tax info and deadlines', icon: 'BookOpen' },
    { id: 'qualify_leads', label: 'Qualify New Clients', description: 'Ask about filing needs and route to advisors', icon: 'TrendingUp' },
  ],
  healthcare: [
    { id: 'book_appointments', label: 'Book Appointments', description: 'Schedule patient visits and consultations', icon: 'Clock' },
    { id: 'triage_calls', label: 'Triage Calls', description: 'Assess urgency and route appropriately', icon: 'Shield' },
    { id: 'collect_info', label: 'Collect Patient Info', description: 'Gather details for intake and follow-up', icon: 'Briefcase' },
    { id: 'provide_info', label: 'Provide Office Info', description: 'Share hours, location, and insurance details', icon: 'Heart' },
  ],
  real_estate: [
    { id: 'book_showings', label: 'Book Property Showings', description: 'Schedule viewings for listed properties', icon: 'Building2' },
    { id: 'qualify_leads', label: 'Qualify Buyers/Sellers', description: 'Assess readiness and match with agents', icon: 'TrendingUp' },
    { id: 'collect_info', label: 'Collect Contact Info', description: 'Capture lead details for agent follow-up', icon: 'Briefcase' },
    { id: 'provide_listings', label: 'Share Listing Details', description: 'Answer questions about available properties', icon: 'BookOpen' },
  ],
  contractors_home_services: [
    { id: 'book_estimates', label: 'Book Estimates', description: 'Schedule on-site quotes and assessments', icon: 'Clock' },
    { id: 'collect_info', label: 'Collect Job Details', description: 'Gather project scope and contact info', icon: 'Briefcase' },
    { id: 'handle_emergency', label: 'Handle Emergencies', description: 'Triage urgent repair requests', icon: 'Shield' },
    { id: 'provide_quotes', label: 'Provide Rough Quotes', description: 'Give ballpark pricing for common jobs', icon: 'DollarSign' },
  ],
  mortgage_broker: [
    { id: 'book_consultations', label: 'Book Consultations', description: 'Schedule mortgage strategy sessions', icon: 'Clock' },
    { id: 'qualify_leads', label: 'Pre-Qualify Applicants', description: 'Assess borrowing capacity and needs', icon: 'TrendingUp' },
    { id: 'collect_info', label: 'Collect Applicant Info', description: 'Gather financial details for applications', icon: 'Briefcase' },
    { id: 'compare_rates', label: 'Discuss Rate Options', description: 'Share current rates and product options', icon: 'DollarSign' },
  ],
  legal_services: [
    { id: 'book_consultations', label: 'Book Consultations', description: 'Schedule initial case review meetings', icon: 'Clock' },
    { id: 'qualify_cases', label: 'Qualify Cases', description: 'Assess case type and urgency', icon: 'Scale' },
    { id: 'collect_info', label: 'Collect Case Details', description: 'Gather preliminary case information', icon: 'Briefcase' },
    { id: 'provide_info', label: 'Provide General Info', description: 'Share office policies and practice areas', icon: 'BookOpen' },
  ],
  gyms_fitness: [
    { id: 'book_tours', label: 'Book Facility Tours', description: 'Schedule visits and trial sessions', icon: 'Building2' },
    { id: 'sell_memberships', label: 'Sell Memberships', description: 'Present plans and close signups', icon: 'DollarSign' },
    { id: 'book_training', label: 'Book Training Sessions', description: 'Schedule personal training appointments', icon: 'Clock' },
    { id: 'collect_info', label: 'Collect Lead Info', description: 'Capture prospect details for follow-up', icon: 'Briefcase' },
  ],
  construction: [
    { id: 'book_consultations', label: 'Book Project Consultations', description: 'Schedule meetings with project managers', icon: 'Clock' },
    { id: 'qualify_projects', label: 'Qualify Projects', description: 'Assess scope, timeline, and budget range', icon: 'TrendingUp' },
    { id: 'collect_info', label: 'Collect Project Details', description: 'Gather specs and contact information', icon: 'Briefcase' },
    { id: 'provide_updates', label: 'Provide Project Updates', description: 'Share status on active projects', icon: 'Building2' },
  ],
  agency: [
    { id: 'book_discovery', label: 'Book Discovery Calls', description: 'Schedule strategy and discovery sessions', icon: 'Clock' },
    { id: 'qualify_leads', label: 'Qualify Prospects', description: 'Assess project scope and budget fit', icon: 'TrendingUp' },
    { id: 'collect_info', label: 'Collect Contact Info', description: 'Capture lead details for team follow-up', icon: 'Briefcase' },
    { id: 'share_portfolio', label: 'Share Portfolio/Case Studies', description: 'Discuss past work and capabilities', icon: 'BookOpen' },
  ],
  distribution_logistics: [
    { id: 'process_orders', label: 'Process Orders', description: 'Take orders and coordinate fulfillment', icon: 'Wrench' },
    { id: 'track_shipments', label: 'Track Shipments', description: 'Provide shipment status updates', icon: 'Globe' },
    { id: 'collect_info', label: 'Collect Account Info', description: 'Onboard new accounts and gather details', icon: 'Briefcase' },
    { id: 'handle_issues', label: 'Handle Delivery Issues', description: 'Triage missing, damaged, or late shipments', icon: 'Shield' },
  ],
  general_business: [
    { id: 'book_appointments', label: 'Book Appointments', description: 'Schedule meetings or demos directly', icon: 'Clock' },
    { id: 'collect_info', label: 'Collect Contact Info', description: 'Gather caller details for team follow-up', icon: 'Briefcase' },
    { id: 'qualify_leads', label: 'Qualify Leads', description: 'Ask discovery questions and route to sales', icon: 'TrendingUp' },
    { id: 'customer_support', label: 'Provide Support', description: 'Answer questions and resolve issues', icon: 'Heart' },
  ],
};

/**
 * Build the sequence of personalization questions for the interview.
 * Skips questions where values already exist (confirms them instead).
 */
export function buildPersonalizationQuestions(
  industry: string,
  businessName: string,
  agentName: string,
  _currentValues: Record<string, string>
): PersonalizationQuestion[] {
  const services = INDUSTRY_SERVICES[industry] || INDUSTRY_SERVICES.general_business;
  const callReasons = INDUSTRY_CALL_REASONS[industry] || INDUSTRY_CALL_REASONS.general_business;
  const agentGoals = INDUSTRY_AGENT_GOALS[industry] || INDUSTRY_AGENT_GOALS.general_business;
  const totalQuestions = 8;

  const questions: PersonalizationQuestion[] = [
    // Q1: Business Name
    {
      id: 'q_business_name',
      fieldKey: 'business_name',
      text: `Let's personalize your AI phone agent! First, let me confirm your business name.`,
      acknowledgmentTemplate: '**{answer}** -- got it! That\'s the name callers will hear.',
      choicesConfig: {
        options: [
          ...(businessName ? [{ id: 'current', label: businessName, description: 'Use current name', icon: 'Building2' }] : []),
          ...(businessName ? [{ id: 'variation', label: `${businessName} LLC`, description: 'Add LLC suffix', icon: 'Building2' }] : []),
        ],
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Enter your business name...',
        progressLabel: `Question 1 of ${totalQuestions}`,
      },
    },

    // Q2: Agent Name
    {
      id: 'q_agent_name',
      fieldKey: 'agent_name',
      text: `What should your AI phone agent call itself when speaking to callers?`,
      acknowledgmentTemplate: 'Nice -- **{answer}** has a great ring to it.',
      choicesConfig: {
        options: [
          { id: 'alex', label: 'Alex', description: 'Friendly and gender-neutral', icon: 'Briefcase' },
          { id: 'sam', label: 'Sam', description: 'Approachable and warm', icon: 'Briefcase' },
          { id: 'jordan', label: 'Jordan', description: 'Modern and professional', icon: 'Briefcase' },
          ...(agentName && !['AI Assistant', 'alex', 'sam', 'jordan'].includes(agentName.toLowerCase())
            ? [{ id: 'current', label: agentName, description: 'Keep current name', icon: 'Briefcase' }]
            : []),
        ],
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Enter a custom agent name...',
        progressLabel: `Question 2 of ${totalQuestions}`,
      },
    },

    // Q3: Website URL (NEW -- trigger point for adaptive options)
    {
      id: 'q_website_url',
      fieldKey: 'website_url',
      text: `Got a website? Share it and I'll tailor the rest of this interview to your business!`,
      acknowledgmentTemplate: 'No worries -- I\'ll use what you\'ve already told me.',
      choicesConfig: {
        options: [
          { id: 'no_website', label: 'No website yet', description: 'Skip this step', icon: 'Globe' },
          { id: 'skip', label: 'Skip for now', description: 'I\'ll set this up later', icon: 'Clock' },
        ],
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Enter your website (e.g., cxtrack.com)...',
        progressLabel: `Question 3 of ${totalQuestions}`,
      },
    },

    // Q4: Services Offered (multi-select, adaptive)
    {
      id: 'q_services',
      fieldKey: 'services_offered',
      text: `What services does your business offer? Select all that apply.`,
      acknowledgmentTemplate: 'Solid lineup. I\'ll make sure your agent knows how to talk about each of those.',
      isAdaptive: true,
      choicesConfig: {
        options: services,
        multiSelect: true,
        allowOther: true,
        otherPlaceholder: 'Add a service not listed...',
        progressLabel: `Question 4 of ${totalQuestions}`,
      },
    },

    // Q5: Agent Goal (NEW, adaptive)
    {
      id: 'q_agent_goal',
      fieldKey: 'agent_goal',
      text: `What should your AI agent primarily try to accomplish on calls?`,
      acknowledgmentTemplate: 'Perfect -- your agent will focus on **{answer}** as its main objective.',
      isAdaptive: true,
      choicesConfig: {
        options: agentGoals,
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Describe your agent\'s primary goal...',
        progressLabel: `Question 5 of ${totalQuestions}`,
      },
    },

    // Q6: Agent Tone
    {
      id: 'q_tone',
      fieldKey: 'agent_tone',
      text: `How should your AI agent sound when speaking to callers?`,
      acknowledgmentTemplate: 'A **{answer}** approach -- that\'ll set the right feel for your callers.',
      choicesConfig: {
        options: [
          { id: 'professional', label: 'Professional & Formal', description: 'Polished and business-like', icon: 'Briefcase' },
          { id: 'friendly', label: 'Friendly & Warm', description: 'Approachable and personable', icon: 'Heart' },
          { id: 'casual', label: 'Casual & Relaxed', description: 'Laid-back and conversational', icon: 'Globe' },
          { id: 'empathetic', label: 'Empathetic & Patient', description: 'Understanding and gentle', icon: 'Shield' },
        ],
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Describe your preferred tone...',
        progressLabel: `Question 6 of ${totalQuestions}`,
      },
    },

    // Q7: Common Call Reasons (multi-select, adaptive)
    {
      id: 'q_call_reasons',
      fieldKey: 'common_call_reasons',
      text: `What do callers usually need when they reach your business? Select all that apply.`,
      acknowledgmentTemplate: 'Good to know. Your agent will be ready for those common scenarios.',
      isAdaptive: true,
      choicesConfig: {
        options: callReasons,
        multiSelect: true,
        allowOther: true,
        otherPlaceholder: 'Add a reason not listed...',
        progressLabel: `Question 7 of ${totalQuestions}`,
      },
    },

    // Q8: Business Hours
    {
      id: 'q_hours',
      fieldKey: 'business_hours',
      text: `When is your business open?`,
      acknowledgmentTemplate: 'Noted. Your agent will know exactly when you\'re available.',
      choicesConfig: {
        options: [
          { id: 'mon_fri_9_5', label: 'Mon-Fri 9am-5pm', description: 'Standard business hours', icon: 'Clock' },
          { id: 'mon_fri_8_6', label: 'Mon-Fri 8am-6pm', description: 'Extended weekday hours', icon: 'Clock' },
          { id: 'mon_sat_9_5', label: 'Mon-Sat 9am-5pm', description: 'Includes Saturdays', icon: 'Clock' },
          { id: 'twenty_four_seven', label: '24/7 Availability', description: 'Always available', icon: 'Clock' },
        ],
        multiSelect: false,
        allowOther: true,
        otherPlaceholder: 'Enter your custom hours...',
        progressLabel: `Question 8 of ${totalQuestions}`,
      },
    },
  ];

  return questions;
}

/**
 * Format collected answers into a message for the AI
 * to generate the final ACTION_PROPOSAL.
 */
export function buildPersonalizationSummaryMessage(
  answers: Record<string, string>,
  industry: string
): string {
  const parts = Object.entries(answers)
    .filter(([_, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return `[PERSONALIZATION_COMPLETE] Here are the collected voice agent personalization values for a ${industry.replace(/_/g, ' ')} business:\n\n${parts}\n\nPlease generate an update_voice_agent ACTION_PROPOSAL with these values. Map each answer to the appropriate personalization field key.`;
}
