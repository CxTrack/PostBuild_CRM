import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserPreferences {
  full_name?: string;
  work_style?: string[];
  communication_preference?: string[];
  goals?: string[];
  expertise?: string[];
  interests?: string[];
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
  userPreferences?: UserPreferences;
  hasUserProfile?: boolean;
  context?: {
    page?: string;
    industry?: string;
    orgName?: string;
    userRole?: string;
    isAdmin?: boolean;
    customer_id?: string;
    // AI Quarterback mode
    quarterbackMode?: boolean;
    insightType?: string;
    insightData?: any;
    // Voice agent personalization mode
    personalizationMode?: boolean;
    personalizationData?: {
      currentValues?: Record<string, string>;
      agentName?: string;
      businessName?: string;
    };
  };
  impersonation?: {
    targetUserId: string;
    targetOrgId: string;
  };
  // Acknowledgment mode for personalization interview
  acknowledgmentMode?: boolean;
  acknowledgmentContext?: {
    questionText?: string;
    accumulatedAnswers?: Record<string, string>;
    nextQuestionText?: string | null;
    cachedSiteContext?: string | null;
  };
}

interface DataIntent {
  needsData: boolean;
  domains: string[];
  filters?: Record<string, any>;
}

// =====================================================
// INTENT CLASSIFIER
// =====================================================
function classifyIntent(message: string, context?: { page?: string; customer_id?: string }): DataIntent {
  const msg = message.toLowerCase();
  const currentPage = context?.page;

  const matchedDomains: string[] = [];
  let filters: Record<string, any> = {};

  if (currentPage?.startsWith('Admin')) {
    const adminPatterns: Record<string, RegExp[]> = {
      admin_kpis: [
        /\b(mrr|arr|revenue|earnings)\b/,
        /\bhow('s| is| are) (the |our )?(platform|system|business|company)\b/,
        /\b(total|how many) (user|org|customer)/,
        /\bactive (user|org)/,
        /\bchurn/,
      ],
      admin_api_health: [
        /\bapi (error|health|status|call)/,
        /\bedge function/,
        /\b(openrouter|retell|twilio|resend|stripe)/,
        /\berror rate/,
      ],
      admin_growth: [
        /\b(user|org) growth\b/,
        /\bnew (user|org|signup)/,
        /\bsignup/,
        /\bconversion/,
        /\btrial/,
      ],
    };
    for (const [domain, patterns] of Object.entries(adminPatterns)) {
      if (patterns.some(p => p.test(msg))) {
        matchedDomains.push(domain);
      }
    }
  }

  if (context?.customer_id) {
    const customerDetailPatterns = [
      /\b(overview|summary|detail|profile|activity|history|update|status|info|summarize|data)\b/,
      /\bcustomer.*\bID:/i,
      /\bbrief overview\b/,
      /\bwhat('s| is) (new|pending|happening)\b/,
      /\bcrm data\b/i,
      /\bcontext_summary_mode\b/i,
      /\bpreparation summary\b/i,
      /\btask preparation\b/i,
      /\bmeeting preparation\b/i,
    ];
    if (customerDetailPatterns.some(p => p.test(msg))) {
      matchedDomains.push('customer_detail');
      filters = { customer_id: context.customer_id };
    }
  }

  const domainPatterns: Record<string, RegExp[]> = {
    customers_summary: [
      /\b(customer|client|patient|borrower|member|contact|account)s?\b/,
      /\bhow many (customer|client|patient|borrower|member|contact|account)s?\b/,
      /\btop (customer|client|patient|borrower)s?\b/,
      /\bhighest.?(value|spend|paying)\b/,
    ],
    invoices_summary: [
      /\b(invoice|bill|billing|commission|receivable)s?\b/,
      /\boverdue\b.*\b(invoice|payment|bill)s?\b/,
      /\b(revenue|paid|outstanding|owed)\b/,
      /\bunpaid\b/,
    ],
    pipeline_summary: [
      /\b(pipeline|deal|opportunit|project|application|job|case|order)s?\b/,
      /\b(pipeline|deal|sales)\s*(value|worth|total)\b/,
      /\bstage\b/,
      /\bwin rate\b/,
      /\bforecast\b/,
    ],
    tasks_summary: [
      /\btask/,
      /\bto.?do/,
      /\bfollow.?up/,
      /\bpunch list/,
      /\boverdue\b.*\btask/,
      /\bassigned to me\b/,
      /\bmy task/,
    ],
    calls_summary: [
      /\bcall(s|\s|$)/,
      /\bphone\b/,
      /\bcall log/,
      /\bcall summar/,
    ],
    transcript_search: [
      /\b(find|search|look for|any) (call|conversation|transcript)s?\s+(about|mention|discuss|where|regarding|related)/,
      /\b(search|find)\s+(transcript|call)s?\s+(for|about)/,
      /\bcall(s|ed)?\s+(about|mention|discuss|regarding)\b/,
      /\btranscript(s)?\s+(about|mention|contain|with|where|for)\b/,
      /\bwho (called|talked|spoke|discussed)\s+(about|regarding)\b/,
      /\b(any|which)\s+(call|conversation)s?\s+(mention|about|discuss|regarding)\b/,
      /\bsemantic search\b/,
      /\bsearch.*(call|transcript|conversation).*for\b/,
    ],
    quotes_summary: [
      /\b(quote|proposal|estimate|bid|engagement letter)s?\b/,
      /\bpending (quote|proposal|estimate)/,
    ],
    expenses_summary: [
      /\b(expense|spending|cost)s?\b/,
      /\bhow much.*(spend|spent|cost)/,
    ],
    products_summary: [
      /\b(product|item|inventory|stock|loan product)s?\b/,
      /\blow stock\b/,
    ],
  };

  for (const [domain, patterns] of Object.entries(domainPatterns)) {
    if (patterns.some(p => p.test(msg))) {
      matchedDomains.push(domain);
    }
  }

  if (matchedDomains.includes('customer_detail') && matchedDomains.includes('customers_summary')) {
    const idx = matchedDomains.indexOf('customers_summary');
    if (idx !== -1) matchedDomains.splice(idx, 1);
  }

  const generalDataPatterns = [
    /\bhow('s| is) (my |the |our )?business\b/,
    /\bgive me a (summary|overview|snapshot|report)\b/,
    /\bwhat('s| is) (happening|going on)\b/,
    /\bhow am i doing\b/,
    /\bmy (numbers|stats|metrics|kpi)/,
    /\bdashboard\b/,
    /\boverall\b/,
  ];

  if (matchedDomains.length === 0 && generalDataPatterns.some(p => p.test(msg))) {
    const pageMap: Record<string, string> = {
      'Customers': 'customers_summary',
      'Invoices': 'invoices_summary',
      'Pipeline': 'pipeline_summary',
      'Tasks': 'tasks_summary',
      'Calls': 'calls_summary',
      'Call Log': 'calls_summary',
      'Quotes': 'quotes_summary',
      'Financials': 'expenses_summary',
      'Products': 'products_summary',
      'Inventory': 'products_summary',
    };
    const mapped = currentPage ? pageMap[currentPage] : null;
    if (mapped) {
      matchedDomains.push(mapped);
    } else {
      matchedDomains.push('dashboard_overview');
    }
  }

  if (matchedDomains.length === 0) {
    return { needsData: false, domains: [], filters: {} };
  }

  return {
    needsData: true,
    domains: matchedDomains.slice(0, 3),
    filters,
  };
}

// =====================================================
// ACTION SYSTEM PROMPT
// =====================================================
const ACTION_SYSTEM_PROMPT = `\n\nACTION SYSTEM:\nWhen the user explicitly asks you to CREATE, ADD, MAKE, UPDATE, CHANGE, RESCHEDULE, or MODIFY something in the CRM, you MUST include an ACTION_PROPOSAL block in your response.\n\nSupported action types and their fields:\n\n1. create_customer -- Create a new customer/client/borrower/patient\n   Fields: name (text, required), email (text), phone (text), company (text), status (select: active/inactive/lead, default: active)\n\n2. create_deal -- Create a new deal/application/project/case/job/order in the pipeline\n   Fields: customer_name (text, required), title (text, required), value (number), stage (select: Lead/Qualified/Proposal/Negotiation/Closed Won/Closed Lost, default: Lead), notes (text)\n\n3. create_task -- Create a new task/to-do/follow-up\n   Fields: title (text, required), description (text), priority (select: low/medium/high/urgent, default: medium), due_date (date), customer_name (text)\n\n4. update_task -- Update an EXISTING task (change due date, priority, status, title, or description)\n   Fields: task_id (hidden, required -- the UUID of the task to update, provided in quarterback context), title (text -- the current task title, for display), due_date (date -- the new due date), priority (select: low/medium/high/urgent), status (select: pending/in_progress/completed/cancelled), description (textarea), customer_name (text -- for display context, not editable)\n   IMPORTANT: When the user asks to change, update, reschedule, modify, or move an EXISTING task, use update_task instead of create_task. If a task_id was provided in the quarterback context, always use it. Only include fields the user wants to change -- omit unchanged fields.\n\n5. add_note -- Add a note to an existing customer\n   Fields: customer_name (text, required), content (text, required)\n\n6. send_email -- Draft and send an email to a customer (requires connected email account)\n   Fields: to_email (text, required), subject (text, required), body (textarea, required), customer_name (text)\n\n7. send_sms -- Draft and send an SMS text message to a customer\n   Fields: to_phone (text, required), message_body (textarea, required), customer_name (text)\n\n8. draft_call_script -- Generate a call script for an outgoing phone call (display only, not executed)\n   Fields: customer_name (text, required), script (textarea, required), key_points (text)\n\n9. update_voice_agent -- Update the AI voice agent personalization values\n   Fields: (dynamic -- based on industry personalization fields provided in PERSONALIZATION context)\n\nFORMAT: After your conversational text, include a fenced block like this:\n\`\`\`ACTION_PROPOSAL\n{"actionType":"create_deal","label":"Create New Application","fields":[{"key":"customer_name","label":"Customer","value":"Margot Miller","type":"text","required":true,"editable":true},{"key":"title","label":"Title","value":"Buying a house","type":"text","required":true,"editable":true},{"key":"value","label":"Value ($)","value":450000,"type":"number","required":false,"editable":true},{"key":"stage","label":"Stage","value":"Lead","type":"select","required":false,"options":["Lead","Qualified","Proposal","Negotiation","Closed Won","Closed Lost"],"editable":true}]}\n\`\`\`\n\nRULES:\n- ONLY propose actions when the user EXPLICITLY asks to create/add/update/change something. Never propose actions for questions or data lookups.\n- For QUARTERBACK MODE: You SHOULD propose send_email, send_sms, draft_call_script, or update_task actions depending on the user's request. If the user asks to change the task itself (due date, priority, status), propose update_task. If they ask to communicate with the customer, propose the appropriate communication action.\n- For PERSONALIZATION MODE: You SHOULD propose update_voice_agent actions after collecting all personalization data.\n- For UPDATE actions (update_task): Only include fields that the user wants to change. Pre-fill task_id from quarterback context if available. The label should be "Update Task" or "Reschedule Task" depending on the change type. Set task_id as type "hidden" so it does not show in the UI.\n- Pre-fill fields with as much info as the user provided. Leave unknown fields with reasonable defaults.\n- Use the industry-appropriate label (e.g., "Create New Application" for mortgage, "Create New Project" for construction, "Create New Case" for legal).\n- If the user's request is missing critical required info (like a customer name for a deal), ask a clarifying question instead of proposing the action.\n- The user will see an interactive card with editable fields and Confirm/Cancel buttons -- they can edit before confirming.\n- Keep your conversational text natural -- briefly explain what you're about to do, then include the ACTION_PROPOSAL block.\n- NEVER include more than one ACTION_PROPOSAL per response.\n\nPERMISSIONS:\n- Users with "user" role can only create/update tasks. They CANNOT create customers, deals, or notes. If a user with "user" role asks to create a customer or deal, tell them they need to contact their admin.\n- Users with "manager", "admin", or "owner" role can perform all actions.\n- The current user's role is provided in the system context above.`;

// =====================================================
// CONTEXT SUMMARY MODE PROMPT
// =====================================================
const CONTEXT_SUMMARY_PROMPT = `\n\n=== CONTEXT SUMMARY MODE ===\nThis request is for a READ-ONLY information panel embedded in a task or appointment detail view. The user CANNOT respond to your output.\n\nSTRICT RULES FOR THIS MODE:\n- Provide ONLY the factual summary requested (relationship overview, key points, recent activity)\n- Do NOT include any of the following:\n  - Multiple choice options (A/B/C/D) or CHOICE_PROPOSAL blocks\n  - "What would you like to do next?" or similar prompts\n  - Follow-up questions\n  - Suggested next steps or action items to choose from\n  - ACTION_PROPOSAL blocks\n- Keep the response concise and purely informational\n- Use bullet points and bold formatting for readability\n- If there is no data for a section, briefly state that (e.g., "No recent calls or invoices.")\n- End with the last factual point. Do NOT add a closing question or call-to-action.\n- Override all other personality/tone instructions that say to end with questions or options.`;

// =====================================================
// MEETING PREP MODE SYSTEM PROMPT
// =====================================================
function buildMeetingPrepSystemPrompt(): string {
  return `\n\n=== MEETING PREP MODE ===
You are now in Meeting Prep mode. You are a sharp executive assistant with deep business acumen. Think like a chief of staff who ensures their executive walks into every meeting fully prepared.

The user's chosen action is stated in their message. Follow the matching mode below.

RESPONSE MODES:

1. RESEARCH MODE ("Research attendees"):
   - For each company domain mentioned, describe what the company likely does based on your knowledge
   - If the domain is well-known (e.g., google.com, salesforce.com), provide specifics
   - If less known, infer from the domain name and attendee context
   - List each attendee with their company and any CRM data available
   - Suggest 2-3 conversation starters relevant to their company/industry
   - Be factual -- clearly state when you are inferring vs. when you have CRM data

2. AGENDA MODE ("Prepare meeting agenda"):
   - Create a structured agenda: Purpose, Attendees, Time allocations, Discussion points, Action items, Next steps
   - Base the agenda on the meeting title, description, and any known customer context
   - If the meeting description is vague, create a professional agenda and note what is assumed
   - Include suggested time allocations based on meeting duration
   - End with "Suggested outcomes to drive toward"

3. PREP NOTES MODE ("Draft prep notes"):
   - Format as a briefing document: Context, Key People, Talking Points, Questions to Ask, Potential Concerns
   - Reference CRM data (lifetime value, last contact) when available
   - Include 2-3 smart questions tailored to the meeting topic
   - Keep it scannable -- bullet points and bold text

4. INTERACTIVE MODE ("Interactive preparation"):
   - Ask the user questions ONE AT A TIME
   - Focus on: (1) What is the goal of this meeting? (2) What is your current relationship with these people? (3) What outcome would make this meeting a success? (4) Anything you are concerned about?
   - After the user answers all questions, synthesize into a concise prep brief
   - End the brief with concrete talking points and a suggested opening/closing statement

TONE:
- Confident and efficient. No fluff.
- Reference specific details from the meeting data (attendee names, companies, times)
- When you lack information, be honest and suggest what the user should look up

FORMAT:
- Use markdown: **bold** for key points, bullet points for lists
- Keep responses under 400 words unless the user asks for more detail
- For agendas, use a structured format with headers

FOLLOW-UP OPTIONS:
- After delivering your content, if you want to offer the user next steps, you MUST use the CHOICE_PROPOSAL block format.
- NEVER write follow-up options as plain text with letters (A/B/C/D) or numbers (1/2/3/4). The UI renders CHOICE_PROPOSAL blocks as clickable buttons.
- Example:
\`\`\`CHOICE_PROPOSAL
{"choices":[{"id":"prep_notes","label":"Draft prep notes","description":"Summarize into a briefing document","icon":"BookOpen"},{"id":"agenda","label":"Prepare meeting agenda","description":"Create a structured agenda","icon":"Calendar"},{"id":"interactive","label":"Help me prepare","description":"Ask me questions to get me ready","icon":"MessageSquare"},{"id":"other","label":"Something else","description":"Tell me what you need","icon":"Pencil"}]}
\`\`\``;
}

// =====================================================
// QUARTERBACK MODE SYSTEM PROMPT
// =====================================================
function buildQuarterbackSystemPrompt(insightType: string, insightData: any, industry: string): string {
  const industryFormatted = industry.replace(/_/g, ' ');
  return `\n\n=== QUARTERBACK MODE ACTIVE ===\nYou are now in AI Quarterback mode. You are a hyper business-savvy sales strategist and account manager. Think like a top-performing closer who knows exactly when and how to re-engage a prospect. Your tone is confident, direct, and actionable. No fluff.\n\nSITUATION DATA:\n${JSON.stringify(insightData, null, 2)}\n\nIMPORTANT: The user has ALREADY been presented with action choices via the UI. Their chosen action is stated in the user message (e.g. "The user chose to draft a text message"). Do NOT present options, do NOT ask what they want to do, do NOT list choices. The decision is already made.\n\nCRITICAL: NEVER write follow-up options as plain text with letters (A/B/C/D) or numbers (1/2/3/4). If you want to offer next steps after completing the user's request, use the CHOICE_PROPOSAL block format so the UI renders them as clickable buttons.\n\nCOMPOUND RISK HANDLING (customer_at_risk):\nWhen the insight type is "customer_at_risk", the SITUATION DATA contains multiple risk signals for a single customer (stale deals, overdue invoices, overdue tasks, inactivity, no outbound emails). The risk_score (0-1) indicates severity.\n- For "recovery_plan": Draft a structured, multi-step recovery plan with specific actions, timelines, and talking points. Address each risk signal individually (e.g. "Step 1: Resolve the overdue invoice this week", "Step 2: Re-engage the stale deal by..."). End with a CHOICE_PROPOSAL offering to execute the first step.\n- For "draft_invoice_followup": Focus specifically on the overdue invoice amount. Draft a firm but professional payment reminder that references the relationship and lifetime value.\n- For other actions (draft_email, draft_call_script): Acknowledge ALL risk signals in your opener, but focus the draft on the chosen action. Reference specific numbers (risk score, dollar amounts, days inactive).\n\nTASK UPDATE HANDLING:\nIf the user asks to change, update, reschedule, or modify the task itself (due date, priority, status), you MUST propose an update_task ACTION_PROPOSAL instead of drafting communication. The task_id is the "id" field from SITUATION DATA above.\n- Pre-fill task_id as type "hidden" so it does not render in the UI\n- Pre-fill the current title (set editable: false)\n- Only include fields the user wants to change (e.g., if they say "change to Monday", only set due_date)\n- Include customer_name for context (set editable: false)\n- After the user confirms a task update, offer to also draft a follow-up message to the customer about the new timeline\n- If the user says something like "change this to Monday" or "reschedule to next week" without specifying which field, they mean due_date\n\nYOUR RESPONSE FLOW (follow this EXACTLY):\n\n1. DRAFT IMMEDIATELY:\n   - Open with ONE punchy sentence acknowledging the situation (reference customer name, dollar amounts, timeframes).\n   - Then draft the requested content right away. No preamble, no options list.\n   - Draft the content IMMEDIATELY. Do not ask more questions.\n   - Be professional but warm. Use the customer's first name. Reference specific details (deal value, days since contact, etc.).\n   - For emails: Include a compelling subject line. Keep body under 150 words. End with a clear call-to-action.\n   - For SMS: Keep under 160 characters if possible. Be direct but friendly.\n   - For call scripts: Include an opening line, 3-4 key talking points, and a strong close/ask.\n   - For task updates: Acknowledge the change, show what will be updated, then propose the update_task action.\n   - Then use the ACTION_PROPOSAL system to propose the action.\n\n2. DRAFTING RULES:\n   - For emails: Use actionType "send_email" with fields: to_email (pre-fill from insight data if available), subject, body (use textarea type), customer_name\n   - For SMS: Use actionType "send_sms" with fields: to_phone (pre-fill from insight data if available), message_body (use textarea type), customer_name\n   - For call scripts: Use actionType "draft_call_script" with fields: customer_name, script (use textarea type), key_points\n   - For task updates: Use actionType "update_task" with fields: task_id (hidden, value from SITUATION DATA "id"), title (text, current title, editable: false), due_date (date, editable: true), priority (select, editable: true), customer_name (text, editable: false). Only include fields being changed.\n   - ALWAYS pre-fill the customer's contact info from the insight data when available\n\n3. TONE & STYLE:\n   - You are a closer, not a support agent. Be decisive.\n   - Use ${industryFormatted} industry terminology naturally.\n   - Reference the specific numbers (deal value, days overdue, lifetime value) to create urgency.\n   - The goal is to help the user take action in under 60 seconds.\n\n4. IMPORTANT:\n   - If the insight has no email address, mention it and suggest the user add one to the customer profile.\n   - If the insight has no phone number and user wants SMS/call, mention it similarly.\n   - After drafting, briefly explain why this approach works for this specific situation.\n   - If the user changes context mid-conversation (e.g., asks to update the task instead of sending an email), follow the new instruction immediately. You are an assistant that handles interjections gracefully.`;
}

// =====================================================
// VOICE AGENT PERSONALIZATION MODE SYSTEM PROMPT
// =====================================================
function buildPersonalizationSystemPrompt(
  industry: string,
  personalizationFields: any[],
  _currentValues: Record<string, string>,
  _agentName: string,
  _businessName: string
): string {
  const industryFormatted = industry.replace(/_/g, ' ');
  const fieldsDescription = personalizationFields.map(f =>
    `- **${f.label}** (key: "${f.key}", ${f.required ? 'required' : 'optional'}): ${f.placeholder || ''}`
  ).join('\n');

  return `\n\n=== VOICE AGENT PERSONALIZATION MODE ===

The frontend has guided the user through a step-by-step personalization interview with clickable choice cards.
The user's collected answers will arrive in a single message prefixed with [PERSONALIZATION_COMPLETE].

YOUR ONLY JOB: When you receive a [PERSONALIZATION_COMPLETE] message, generate an update_voice_agent ACTION_PROPOSAL.

PERSONALIZATION FIELDS AVAILABLE (map answers to these keys):
${fieldsDescription}

INDUSTRY: ${industryFormatted}

INSTRUCTIONS:
1. Parse the key-value pairs from the [PERSONALIZATION_COMPLETE] message.
2. Write a brief, friendly summary (2-3 sentences) confirming what you understood.
3. Include an ACTION_PROPOSAL block with actionType "update_voice_agent" and label "Update AI Phone Agent".
4. Map each collected value to the matching personalization field key. Every field should have "editable": true.
5. For multi-value answers (services, call reasons), keep them as a single comma-separated text value.

Example ACTION_PROPOSAL format:
\`\`\`ACTION_PROPOSAL
{"actionType":"update_voice_agent","label":"Update AI Phone Agent","fields":[{"key":"business_name","label":"Business Name","value":"Acme Tax Services","type":"text","required":true,"editable":true},{"key":"agent_name","label":"Agent Name","value":"Alex","type":"text","required":true,"editable":true},{"key":"services_offered","label":"Services Offered","value":"Tax Preparation, Bookkeeping","type":"textarea","required":true,"editable":true},{"key":"agent_tone","label":"Agent Tone","value":"Friendly & Warm","type":"text","required":false,"editable":true},{"key":"common_call_reasons","label":"Common Call Reasons","value":"Filing Questions, Scheduling","type":"textarea","required":false,"editable":true},{"key":"business_hours","label":"Business Hours","value":"Mon-Fri 9am-5pm","type":"text","required":false,"editable":true}]}
\`\`\`

If the user sends any other message (not [PERSONALIZATION_COMPLETE]), respond normally as Sparky the CoPilot. The interview is handled entirely by the frontend.`;
}

// =====================================================
// SYSTEM PROMPT BUILDER
// =====================================================
function buildSystemPrompt(
  context?: { page?: string; industry?: string; orgName?: string },
  orgName?: string,
  ragData?: Record<string, any>,
  userRole?: string,
  isAdmin?: boolean,
  userPreferences?: UserPreferences,
  hasUserProfile?: boolean,
  planTier?: string,
  conversationLength?: number,
  isPersonalizationMode?: boolean
): string {
  const pageName = context?.page || "Dashboard";
  const industry = context?.industry || "general business";
  const org = context?.orgName || orgName || "the organization";
  const role = userRole || "user";
  const today = new Date().toISOString().split('T')[0];
  const userName = userPreferences?.full_name?.split(' ')[0] || '';

  let prompt: string;

  if (isAdmin) {
    prompt = `You are Sparky, the AI assistant for CxTrack platform administrators.\nToday's date is ${today}.\nThe admin user is viewing the "${pageName}" page. Their role is "${role}".\n\nYOUR PRIMARY PURPOSE:\nYou are a platform administration assistant. You have access to platform-wide metrics and KPIs. Help the admin understand:\n- Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR)\n- Total users, organizations, and their subscription tiers\n- User growth and signup trends\n- API health, error rates, and edge function performance\n- Churn rates and trial-to-paid conversion\n- Organization breakdown by industry and plan tier\n\nCAPABILITIES:\n- Analyze platform-wide KPIs using the retrieved admin data below\n- Provide insights on user growth, revenue trends, and API health\n- Identify areas of concern (high churn, API errors, declining signups)\n- Answer questions about the platform's overall health and performance\n- You can also answer general CRM data questions like a normal CoPilot if the admin asks about their own org data\n- You can also answer general knowledge questions conversationally\n\nCRITICAL RULES:\n- ONLY reference data that appears in the "PLATFORM DATA" or "CRM DATA" sections below\n- If the data section is empty or doesn't contain the answer, say "I don't have that specific data available right now"\n- NEVER invent, estimate, or hallucinate numbers, user counts, or revenue figures\n- When citing numbers, be specific and exact\n- If data shows $0 or 0 counts, report that honestly\n- Keep responses concise (under 300 words) unless detailed analysis is requested\n- Use markdown formatting: **bold** for key numbers, bullet points for lists\n\nGENERAL KNOWLEDGE:\n- You are also a helpful general-purpose chatbot. You can answer questions on any topic using your training knowledge.\n- For CRM data questions, always use the retrieved data. For general knowledge, answer confidently from your training.\n- You do NOT have internet access. You cannot look up weather, news, live scores, stock prices, or any real-time information. If asked, clearly state: "I don't have internet access -- I can only help with platform data and general knowledge."\n- Your general knowledge has a training cutoff and may be outdated for very recent events. When unsure, say so honestly.`;
  } else {
    prompt = `You are Sparky -- think of yourself as an Ivy League graduate who spent years at a top management consulting firm (McKinsey/Bain/BCG) and now serves as a dedicated CoPilot inside the CxTrack CRM platform for ${org}.\nToday's date is ${today}.\nYou help users in the ${industry.replace(/_/g, " ")} industry. The user is on the "${pageName}" page. Their role is "${role}".${userName ? ` The user's first name is ${userName}.` : ''}\nThe organization's plan tier is "${planTier || 'free'}".\n\nPERSONALITY & TONE:\n- Professional but warm. Never stiff, never sloppy.${userName ? ` Use "${userName}" naturally when it fits -- not every message, but enough to feel personal.` : ''}\n- Always thinking one step ahead. Anticipate what the user needs before they ask.\n- Concise by default. Lead with the answer, then offer to go deeper.\n- Action-oriented. Every response should end with a suggested next step or a question to keep momentum.\n- Never use filler phrases ("Great question!", "I'd be happy to help!", "Sure thing!", "Absolutely!"). Get straight to value.\n- When presenting options, ${isPersonalizationMode ? 'use the CHOICE_OPTIONS block format described in the PERSONALIZATION section below.' : 'use the CHOICE_PROPOSAL block format (described below) to offer clickable options. NEVER write options as plain text with letters (A/B/C/D) or numbers (1/2/3/4).'}\n- You are a COPILOT, not a Q&A bot. Proactively suggest, flag issues, and guide.\n- Use analogies from business strategy when helpful (e.g., "Think of your pipeline like a funnel...").\n- Speak like a trusted advisor, not a customer support agent.\n\nYOUR PRIMARY PURPOSE:\nYou are a CRM business assistant AND a general-purpose chatbot. Your #1 strength is analyzing the user's business data from CxTrack and turning it into actionable insights. But you can also help with general knowledge questions, writing, brainstorming, and more.\n\nCAPABILITIES:\n- Analyze CRM business data using the retrieved data below\n- Provide business insights, trends, and actionable recommendations\n- Help with CxTrack navigation and feature explanations\n- Create CRM records (customers, deals, tasks, notes) when asked -- see ACTION SYSTEM below\n- Answer general knowledge questions conversationally\n- Help with writing, calculations, brainstorming, and other general tasks\n\nOVERDUE TASK HANDLING:\nWhen task data is available in the CRM DATA section:\n- 0 overdue: "All caught up -- no overdue tasks right now." Then pivot to something proactive.\n- 1-4 overdue: List EACH one with: title, customer name (if linked), priority, how many days overdue, and a suggested next action for each.\n- 5+ overdue: "${userName || 'Hey'}, you have [N] overdue tasks -- that's building up. Want me to help you work through them?" Then include a CHOICE_PROPOSAL block with options: "Show the most urgent ones first", "Draft follow-up messages for each", "Help me prioritize and reschedule", "Something else"\n- For follow-up actions on overdue tasks: always offer email and text options.\n- Only suggest outgoing call scripts if planTier is "elite_premium" or "enterprise".\n- For other plan tiers, when call scripts would be relevant, mention: "Upgrade to Elite Premium to unlock outbound call scripting."\n\nPROACTIVE BEHAVIOR:\n- Vague questions ("how's things?", "what's up?", "hey") -> Give a quick business snapshot from available data, then include a CHOICE_PROPOSAL block with options to drill deeper.\n- When showing data, end with a specific action offer, NOT "let me know if you need anything."\n- Flag concerning patterns (declining revenue, stale deals, overdue tasks piling up) even if not directly asked.\n- If you notice something the user should act on, say so directly. Be the advisor who speaks up.${isPersonalizationMode ? '' : `\n\nCHOICE_PROPOSAL FORMAT (for offering clickable follow-up options):\nWhen you want to offer the user choices or next steps, include a fenced block like this AFTER your conversational text:\n\\\`\\\`\\\`CHOICE_PROPOSAL\n{"choices":[{"id":"option_1","label":"Option label","description":"Brief description","icon":"Mail"},{"id":"option_2","label":"Another option","description":"Brief description","icon":"Calendar"}]}\n\\\`\\\`\\\`\n\nAvailable icons: Mail, MessageSquare, Phone, Calendar, Globe, BookOpen, Briefcase, Pencil, Zap, BarChart3\n\nCRITICAL RULES FOR OPTIONS:\n- NEVER write options as plain text (no "A) ...", "B) ...", "1. ...", "2. ..."). All options MUST use the CHOICE_PROPOSAL block so the UI renders them as clickable buttons.\n- Use 2-4 choices. Always include an "other" option (id: "other", label: "Something else", icon: "Pencil").\n- Use this for: follow-ups after analysis, action suggestions, clarifying ambiguous requests, and whenever a decision point arises.\n- If you only have one suggestion and no alternatives, just state it in prose -- no CHOICE_PROPOSAL needed.`}\n\nCRM DATA RULES:\n- ONLY reference data that appears in the "CRM DATA" section below\n- If the CRM DATA section is empty or doesn't contain the answer, say "I don't have that specific data available right now" and suggest the user check the relevant page\n- NEVER invent, estimate, or hallucinate numbers, customer names, dollar amounts, deal titles, or statistics\n- If an array in the data is empty (e.g. "pipeline_items":[]), you MUST say there are none -- do NOT make up items\n- When citing numbers, be specific and exact\n- If data shows $0 or 0 counts, report that honestly\n\nGENERAL KNOWLEDGE:\n- You are also a helpful general-purpose chatbot. You can answer questions on any topic using your training knowledge.\n- For CRM data questions, always use the retrieved data. For general knowledge, answer confidently from your training.\n- You do NOT have internet access. You cannot look up weather, news, live scores, stock prices, or any real-time information. If asked, clearly state: "I don't have internet access -- I can only help with your CRM data and general knowledge."\n- Your general knowledge has a training cutoff and may be outdated for very recent events. When unsure, say so honestly.\n\nFORMATTING:\n- Keep responses concise (under 300 words) unless detailed analysis is requested\n- Use markdown formatting: **bold** for key numbers, bullet points for lists`;
  }

  if (!isAdmin && userPreferences) {
    const prefs: string[] = [];
    if (userPreferences.full_name) prefs.push(`Name: ${userPreferences.full_name}`);
    if (userPreferences.work_style?.length) prefs.push(`Work style: ${userPreferences.work_style.join(', ')}`);
    if (userPreferences.communication_preference?.length) prefs.push(`Communication preference: ${userPreferences.communication_preference.join(', ')}`);
    if (userPreferences.goals?.length) prefs.push(`Goals: ${userPreferences.goals.join(', ')}`);
    if (userPreferences.expertise?.length) prefs.push(`Expertise: ${userPreferences.expertise.join(', ')}`);
    if (userPreferences.interests?.length) prefs.push(`Interests: ${userPreferences.interests.join(', ')}`);

    if (prefs.length > 1) {
      prompt += `\n\nUSER PROFILE CONTEXT (from their Settings > Profile > AI CoPilot Context):\n${prefs.join('\n')}\n\nAdapt your responses to match their preferences:\n- If they prefer "concise" communication, keep it tight. If "detailed", go deeper.\n- If they have specific goals (e.g., "grow revenue", "improve retention"), frame your insights around those goals.\n- If they have expertise listed, match the sophistication level. Don't over-explain things they already know.\n- Reference their goals or work style naturally when relevant (e.g., "Since you're focused on retention...").`;
    }
  }

  if (!isAdmin && hasUserProfile === false && (conversationLength === 0 || conversationLength === undefined)) {
    prompt += `\n\nPROFILE NUDGE (mention ONCE at the end of your first response):\nThe user hasn't set up their AI CoPilot Context yet. After answering their question, add a brief note:\n"By the way, I noticed your AI CoPilot Context isn't set up yet. Head to **Settings > Profile** and fill in your work style, goals, and expertise -- it helps me give you much more personalized advice."\nOnly mention this once. Do NOT repeat in subsequent messages.`;
  }

  if (ragData && Object.keys(ragData).length > 0) {
    const adminEntries = Object.entries(ragData).filter(([k]) => k.startsWith('admin_'));
    const transcriptEntries = Object.entries(ragData).filter(([k]) => k === 'transcript_search');
    const crmEntries = Object.entries(ragData).filter(([k]) => !k.startsWith('admin_') && k !== 'transcript_search');

    if (adminEntries.length > 0) {
      prompt += `\n\n--- PLATFORM DATA (admin-level metrics retrieved from the database) ---`;
      for (const [domain, data] of adminEntries) {
        if (data && !data.error) {
          const label = domain.replace(/_/g, ' ').replace('admin ', '').trim().toUpperCase();
          prompt += `\n[${label}]: ${JSON.stringify(data)}`;
        }
      }
      prompt += `\n--- END PLATFORM DATA ---`;
    }

    if (transcriptEntries.length > 0) {
      const [, searchResults] = transcriptEntries[0];
      prompt += `\n\n--- SEMANTIC CALL TRANSCRIPT SEARCH RESULTS ---\nThe following call transcripts were found via semantic search (similarity scores range from 0 to 1, higher = more relevant).\nPresent these results to the user in a clear, organized format. Include the similarity score, date, sentiment, and key topics for each match.\nIf transcript_preview is available, use it to provide specific details about what was discussed.\nDo NOT make up information beyond what is in the search results.`;
      prompt += `\n${JSON.stringify(searchResults)}`;
      prompt += `\n--- END TRANSCRIPT SEARCH RESULTS ---`;
    }

    if (crmEntries.length > 0) {
      const hasCustomerDetail = crmEntries.some(([k]) => k === 'customer_detail');
      if (hasCustomerDetail) {
        prompt += `\n\nCRITICAL INSTRUCTION FOR CUSTOMER DETAIL SUMMARY:\nThe data below is the COMPLETE record for this customer from the database. If an array is empty (e.g. "pipeline_items":[], "open_tasks":[], "recent_invoices":[]), that means there are ZERO items -- you MUST state "none" or "no [items]" for that category. Do NOT invent deals, applications, dollar amounts, task names, or any other information that is not explicitly present in the JSON below. Report ONLY what you see.`;
      }

      prompt += `\n\n--- CRM DATA (retrieved from the database for this user) ---`;
      for (const [domain, data] of crmEntries) {
        if (data && !data.error) {
          const label = domain.replace(/_/g, ' ').replace('summary', '').trim().toUpperCase();
          prompt += `\n[${label}]: ${JSON.stringify(data)}`;
        }
      }
      prompt += `\n--- END CRM DATA ---`;
    }
  } else {
    if (isAdmin) {
      prompt += `\n\nNO PLATFORM DATA was retrieved for this query. If you are asking about platform metrics, try asking about MRR, user growth, API health, or organization breakdown.`;
    } else {
      prompt += `\n\nNO CRM DATA was retrieved for this query. If the user is asking about their business data, suggest they rephrase to ask about specific CRM data (customers, invoices, pipeline, tasks, calls, quotes, expenses, products).`;
    }
  }

  if (!isAdmin) {
    const industryTerms: Record<string, string> = {
      mortgage_broker: "Use 'borrowers' instead of 'customers', 'applications' instead of 'deals', 'commissions' instead of 'invoices'.",
      healthcare: "Use 'patients' instead of 'customers'.",
      real_estate: "Use 'contacts' instead of 'customers', 'deals' instead of 'pipeline items'.",
      legal_services: "Use 'clients' instead of 'customers', 'cases' instead of 'pipeline items'.",
      contractors_home_services: "Use 'clients' instead of 'customers', 'jobs' instead of 'pipeline items', 'estimates' instead of 'quotes'.",
      construction: "Use 'clients' instead of 'customers', 'projects' instead of 'pipeline items', 'bids' instead of 'quotes'.",
      gyms_fitness: "Use 'members' instead of 'customers'.",
      agency: "Use 'clients' instead of 'customers', 'projects' instead of 'pipeline items', 'proposals' instead of 'quotes'.",
      distribution_logistics: "Use 'accounts' instead of 'customers', 'orders' instead of 'pipeline items'.",
      tax_accounting: "Use 'clients' instead of 'customers', 'engagement letters' instead of 'quotes'.",
    };

    const terms = industryTerms[context?.industry || ""];
    if (terms) {
      prompt += `\n\nINDUSTRY TERMINOLOGY: ${terms}`;
    }

    prompt += ACTION_SYSTEM_PROMPT;
  }

  return prompt;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =====================================================
// MAIN HANDLER
// =====================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    if (!body.message || typeof body.message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isContextSummaryMode = body.message.startsWith('[CONTEXT_SUMMARY_MODE]');
    const isMeetingPrepMode = body.message.startsWith('[MEETING_PREP_MODE]');
    const isPersonalizationMode = !!body.context?.personalizationMode;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let effectiveUserId = user.id;

    if (body.impersonation?.targetUserId && body.impersonation?.targetOrgId) {
      const { data: adminVerify } = await supabaseAdmin
        .from("admin_settings")
        .select("is_admin")
        .eq("user_id", user.id)
        .eq("is_admin", true)
        .single();

      if (adminVerify) {
        effectiveUserId = body.impersonation.targetUserId;
        console.log(`[Impersonation] Admin ${user.id} acting as ${effectiveUserId} in org ${body.impersonation.targetOrgId}`);
      } else {
        console.warn(`[Impersonation] Non-admin ${user.id} attempted impersonation -- ignored`);
      }
    }

    let membershipQuery = supabaseAdmin
      .from("organization_members")
      .select("organization_id, role, organizations(subscription_tier, name, industry_template)")
      .eq("user_id", effectiveUserId)
      .eq("is_impersonation", false);

    if (effectiveUserId !== user.id && body.impersonation?.targetOrgId) {
      membershipQuery = membershipQuery.eq("organization_id", body.impersonation.targetOrgId);
    }

    const { data: membership } = await membershipQuery.limit(1).single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "No organization found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = membership.organization_id;
    const userRole = membership.role || "user";
    const orgData = membership.organizations as any;
    const planTier = orgData?.subscription_tier || "free";
    const orgName = orgData?.name || "Your Organization";
    const orgIndustry = orgData?.industry_template || body.context?.industry || 'general_business';

    let isVerifiedAdmin = false;
    if (body.context?.isAdmin) {
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_settings")
        .select("is_admin")
        .eq("user_id", user.id)
        .eq("is_admin", true)
        .single();
      isVerifiedAdmin = !!adminCheck;
    }

    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .rpc("get_or_create_token_usage", {
        p_user_id: effectiveUserId,
        p_organization_id: orgId,
        p_plan_tier: planTier,
      });

    if (tokenError) {
      return new Response(
        JSON.stringify({ error: "Failed to check token balance", debug: String(tokenError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokensRemaining = tokenRecord.tokens_allocated - tokenRecord.tokens_used;
    if (tokensRemaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "token_limit_reached",
          tokensRemaining: 0,
          tokensAllocated: tokenRecord.tokens_allocated,
          tokensUsed: tokenRecord.tokens_used,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // === ACKNOWLEDGMENT MODE: conversational AI acknowledgment for personalization interview ===
    if (body.acknowledgmentMode) {
      const ackAnswer = body.message || '';
      const ackQuestion = body.acknowledgmentContext?.questionText || '';
      const accumulatedAnswers = body.acknowledgmentContext?.accumulatedAnswers || {};
      const nextQuestionText = body.acknowledgmentContext?.nextQuestionText || null;
      const cachedSiteContext = body.acknowledgmentContext?.cachedSiteContext || null;
      const nextQuestionFieldKey = body.acknowledgmentContext?.nextQuestionFieldKey || null;
      const isNextQuestionAdaptive = body.acknowledgmentContext?.isNextQuestionAdaptive || false;
      const nextQuestionDefaultOptions = body.acknowledgmentContext?.nextQuestionDefaultOptions || null;

      // URL detection: match bare domains (cxtrack.com), www prefixed, and full URLs
      const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s,]*)?/i;
      const urlMatch = ackAnswer.match(urlPattern);
      let siteContext = cachedSiteContext || '';
      let firecrawlTokenCost = 0;

      // Only scrape if we found a URL AND don't already have cached site context
      if (urlMatch && !cachedSiteContext) {
        // Normalize: ensure https:// prefix
        let scrapableUrl = urlMatch[0];
        if (!/^https?:\/\//i.test(scrapableUrl)) {
          scrapableUrl = `https://${scrapableUrl}`;
        }

        const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
        if (FIRECRAWL_API_KEY) {
          try {
            const fcController = new AbortController();
            const fcTimeout = setTimeout(() => fcController.abort(), 4000);

            const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              signal: fcController.signal,
              body: JSON.stringify({
                url: scrapableUrl,
                formats: ["markdown"],
                onlyMainContent: true,
                timeout: 4000,
              }),
            });

            clearTimeout(fcTimeout);

            if (fcResponse.ok) {
              const fcData = await fcResponse.json();
              const title = fcData.data?.metadata?.title || '';
              const description = fcData.data?.metadata?.description || '';
              const markdown = (fcData.data?.markdown || '').substring(0, 600);
              siteContext = `Website: ${title}. ${description}. Content preview: ${markdown}`;
              firecrawlTokenCost = 50;
            }
          } catch {
            // Firecrawl failed -- proceed without site context
          }
        }
      }

      // Build accumulated Q&A context string for conversational memory
      const qaEntries = Object.entries(accumulatedAnswers);
      const accumulatedContext = qaEntries.length > 0
        ? qaEntries.map(([key, val]) => `- ${key}: ${val}`).join('\n')
        : '';

      // Two prompt modes: merged (ack + transition) vs last-question (ack only)
      let ackSystemPrompt: string;
      let ackUserPrompt: string;

      if (nextQuestionText) {
        // MERGED: Acknowledge + naturally transition to the next topic
        ackSystemPrompt = "You are a warm, conversational onboarding assistant helping set up a voice AI agent. Generate a response that: 1) Acknowledges the user's answer with specific details (reference their website/business if context is provided). 2) Transitions naturally into the next topic. Write 2-4 sentences. Be conversational and personable. Under 80 words. Do NOT repeat the next question verbatim -- just bridge to it naturally.";
        ackUserPrompt = [
          `Current question: ${ackQuestion}`,
          `User's answer: ${ackAnswer}`,
          accumulatedContext ? `\nPrevious answers in this interview:\n${accumulatedContext}` : '',
          siteContext ? `\nResearched website data: ${siteContext}` : '',
          `\nNext topic to transition into: ${nextQuestionText}`,
        ].filter(Boolean).join('\n');
      } else {
        // LAST QUESTION: Warm closing acknowledgment only
        ackSystemPrompt = "You are a warm onboarding assistant. Generate a brief 1-2 sentence acknowledgment of the user's final answer. Reference specifics from their answer. Be encouraging. Under 40 words.";
        ackUserPrompt = [
          `Question: ${ackQuestion}`,
          `User's answer: ${ackAnswer}`,
          accumulatedContext ? `\nContext from earlier in this interview:\n${accumulatedContext}` : '',
          siteContext ? `\nWebsite context: ${siteContext}` : '',
        ].filter(Boolean).join('\n');
      }

      // Determine whether to generate adaptive options for the next question
      const shouldAdapt = isNextQuestionAdaptive && nextQuestionFieldKey
        && (siteContext || Object.keys(accumulatedAnswers).length > 2);

      // Build adaptive options prompt if needed
      let adaptiveSystemPrompt = '';
      let adaptiveUserPrompt = '';
      if (shouldAdapt) {
        const fieldLabels: Record<string, string> = {
          services_offered: 'services/products the business offers',
          agent_goal: 'primary goal for the AI phone agent on calls',
          common_call_reasons: 'common reasons callers contact the business',
        };
        const fieldLabel = fieldLabels[nextQuestionFieldKey] || nextQuestionFieldKey;

        adaptiveSystemPrompt = `You generate choice options for a voice agent setup interview.
Return ONLY valid JSON: { "options": [{ "id": "snake_case_id", "label": "Short Label", "description": "1 sentence description", "icon": "IconName" }] }
Generate 4-6 options specific to the business described.
Available icons: Briefcase, Clock, Heart, Shield, TrendingUp, DollarSign, BookOpen, Globe, Building2, Wrench, Calculator, Scale.
Make labels concise (2-4 words). Make descriptions helpful but under 8 words.
Base your options on the business context provided. Be specific -- avoid generic labels.`;

        const contextParts = [];
        if (siteContext) contextParts.push(`Website research: ${siteContext}`);
        if (Object.keys(accumulatedAnswers).length > 0) {
          contextParts.push(`Interview answers so far:\n${Object.entries(accumulatedAnswers).map(([k,v]) => `- ${k}: ${v}`).join('\n')}`);
        }
        if (nextQuestionDefaultOptions?.length) {
          contextParts.push(`Default options (for reference, generate BETTER ones): ${nextQuestionDefaultOptions.map((o: any) => o.label).join(', ')}`);
        }

        adaptiveUserPrompt = `Field: ${nextQuestionFieldKey} (${fieldLabel})\n\n${contextParts.join('\n\n')}\n\nGenerate 4-6 options specific to this business.`;
      }

      try {
        // Run acknowledgment + adaptive options in parallel (no added latency)
        const [ackAiResponse, adaptiveAiResponse] = await Promise.all([
          // 1. Acknowledgment AI call (existing behavior)
          fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://crm.cxtrack.com",
              "X-Title": "CxTrack CRM",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001",
              messages: [
                { role: "system", content: ackSystemPrompt },
                { role: "user", content: ackUserPrompt },
              ],
              max_tokens: 250,
              temperature: 0.7,
            }),
          }),

          // 2. Adaptive options AI call (only when shouldAdapt, otherwise null)
          shouldAdapt
            ? fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": "https://crm.cxtrack.com",
                  "X-Title": "CxTrack CRM",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.0-flash-001",
                  messages: [
                    { role: "system", content: adaptiveSystemPrompt },
                    { role: "user", content: adaptiveUserPrompt },
                  ],
                  max_tokens: 400,
                  temperature: 0.3,
                  response_format: { type: "json_object" },
                }),
              })
            : Promise.resolve(null),
        ]);

        // Parse acknowledgment result
        if (!ackAiResponse.ok) {
          throw new Error(`OpenRouter ack returned ${ackAiResponse.status}`);
        }
        const ackAiResult = await ackAiResponse.json();
        const ackContent = ackAiResult.choices?.[0]?.message?.content || "Got it, thanks!";
        let aiTokensUsed = ackAiResult.usage?.total_tokens || 50;

        // Parse adaptive options result (with safe fallback)
        let adaptedChoicesConfig: any = undefined;
        if (adaptiveAiResponse && adaptiveAiResponse.ok) {
          try {
            const adaptiveResult = await adaptiveAiResponse.json();
            aiTokensUsed += adaptiveResult.usage?.total_tokens || 0;
            const adaptiveContent = adaptiveResult.choices?.[0]?.message?.content || '';
            const parsed = JSON.parse(adaptiveContent);
            // Validate structure: must have options array with id, label, description
            if (parsed?.options && Array.isArray(parsed.options) && parsed.options.length >= 2) {
              const validOptions = parsed.options
                .filter((o: any) => o.id && o.label && o.description)
                .slice(0, 6) // Cap at 6 options
                .map((o: any) => ({
                  id: String(o.id),
                  label: String(o.label),
                  description: String(o.description),
                  icon: String(o.icon || 'Briefcase'),
                }));
              if (validOptions.length >= 2) {
                adaptedChoicesConfig = { options: validOptions };
              }
            }
          } catch {
            // Adaptive options parsing failed -- fall back to static options (no error to user)
          }
        }

        const totalTokenCost = aiTokensUsed + firecrawlTokenCost;

        // Deduct tokens
        await supabaseAdmin
          .from("ai_token_usage")
          .update({
            tokens_used: tokenRecord.tokens_used + totalTokenCost,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tokenRecord.id);

        return new Response(
          JSON.stringify({
            response: ackContent,
            siteContext: siteContext || undefined,
            adaptedChoicesConfig: adaptedChoicesConfig || undefined,
            tokensUsed: tokenRecord.tokens_used + totalTokenCost,
            tokensRemaining: Math.max(0, tokensRemaining - totalTokenCost),
            tokensAllocated: tokenRecord.tokens_allocated,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (ackErr) {
        // AI call failed -- return fallback, still deduct firecrawl tokens if applicable
        if (firecrawlTokenCost > 0) {
          await supabaseAdmin
            .from("ai_token_usage")
            .update({
              tokens_used: tokenRecord.tokens_used + firecrawlTokenCost,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tokenRecord.id);
        }

        return new Response(
          JSON.stringify({
            response: "Got it, thanks!",
            siteContext: siteContext || undefined,
            tokensUsed: tokenRecord.tokens_used + firecrawlTokenCost,
            tokensRemaining: Math.max(0, tokensRemaining - firecrawlTokenCost),
            tokensAllocated: tokenRecord.tokens_allocated,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({
          response: "AI service is not configured. The OPENROUTER_API_KEY secret is missing.",
          tokensUsed: 0,
          tokensRemaining,
          tokensAllocated: tokenRecord.tokens_allocated,
          provider: "none",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. RAG: Classify intent and fetch data
    const intent = classifyIntent(body.message, {
      page: body.context?.page,
      customer_id: body.context?.customer_id,
    });

    let ragData: Record<string, any> = {};

    if (isVerifiedAdmin && intent.domains.some(d => d.startsWith('admin_'))) {
      for (const domain of intent.domains.filter(d => d.startsWith('admin_'))) {
        try {
          if (domain === 'admin_kpis') {
            const { data } = await supabaseAdmin.rpc('admin_get_platform_kpis');
            if (data) ragData[domain] = data;
          } else if (domain === 'admin_api_health') {
            const { data } = await supabaseAdmin.rpc('admin_get_api_usage_summary', { p_days: 30 });
            if (data) ragData[domain] = data;
          } else if (domain === 'admin_growth') {
            const { data } = await supabaseAdmin.rpc('admin_get_user_growth', { p_months: 6 });
            if (data) ragData[domain] = data;
          }
        } catch (e) {
          console.error(`Admin RAG error for ${domain}:`, e);
        }
      }
    }

    if (intent.needsData) {
      for (const domain of intent.domains.filter(d => !d.startsWith('admin_'))) {
        try {
          const rpcFilters = domain === 'customer_detail' && intent.filters
            ? intent.filters
            : {};

          const { data: domainData, error: rpcError } = await supabaseAdmin
            .rpc("copilot_query_crm_data", {
              p_user_id: effectiveUserId,
              p_organization_id: orgId,
              p_role: userRole,
              p_query_domain: domain,
              p_filters: rpcFilters,
            });

          if (!rpcError && domainData) {
            ragData[domain] = domainData;
          }
        } catch (rpcErr) {
          console.error(`RAG RPC error for ${domain}:`, rpcErr);
        }
      }
    }

    // 6b. Semantic transcript search (pgvector)
    if (intent.domains.includes('transcript_search')) {
      try {
        const sbUrl = Deno.env.get('SUPABASE_URL')
        const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (sbUrl && sbKey) {
          // Generate query embedding via generate-embedding function
          const embResponse = await fetch(`${sbUrl}/functions/v1/generate-embedding`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: body.message,
              table_name: '_query_only',
              record_id: 'none',
              organization_id: orgId,
            }),
          })

          if (embResponse.ok) {
            const embResult = await embResponse.json()
            if (embResult.embedding) {
              // Call match_call_summaries RPC
              const { data: matches, error: matchErr } = await supabaseAdmin
                .rpc('match_call_summaries', {
                  query_embedding: embResult.embedding,
                  p_organization_id: orgId,
                  match_threshold: 0.5,
                  match_count: 5,
                })

              if (!matchErr && matches && matches.length > 0) {
                ragData['transcript_search'] = matches.map((m: any) => ({
                  similarity: Math.round(m.similarity * 100) / 100,
                  summary: m.summary_text,
                  sentiment: m.sentiment,
                  topics: m.key_topics,
                  caller: m.caller_phone,
                  duration_sec: m.duration_ms ? Math.round(m.duration_ms / 1000) : null,
                  date: m.created_at,
                  transcript_preview: m.transcript?.substring(0, 500) || null,
                }))
              } else {
                ragData['transcript_search'] = { message: 'No matching call transcripts found.' }
              }
            }
          }
        }
      } catch (e) {
        console.error('[copilot-chat] Transcript search error:', e)
      }
    }

    // 6c. Retrieve copilot memories (recent + semantic)
    let memoriesForPrompt: Array<{type: string; content: string; date: string; importance: number}> = [];
    if (!isContextSummaryMode && !isPersonalizationMode) {
      try {
        // Recent memories (last 10 by recency)
        const { data: recentMemories } = await supabaseAdmin
          .from('copilot_memory')
          .select('id, memory_type, content, importance_score, created_at')
          .eq('user_id', effectiveUserId)
          .eq('organization_id', orgId)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentMemories) {
          memoriesForPrompt = recentMemories.map((m: any) => ({
            type: m.memory_type,
            content: m.content,
            date: m.created_at,
            importance: m.importance_score,
          }));
        }

        // Semantic memories (top 5 by relevance to current query)
        const sbUrl = Deno.env.get('SUPABASE_URL');
        const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (sbUrl && sbKey && body.message.length > 15) {
          const embResp = await fetch(`${sbUrl}/functions/v1/generate-embedding`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: body.message,
              table_name: '_query_only',
              record_id: 'none',
              organization_id: orgId,
            }),
          });

          if (embResp.ok) {
            const embResult = await embResp.json();
            if (embResult.embedding) {
              const { data: semanticMemories } = await supabaseAdmin
                .rpc('match_copilot_memories', {
                  query_embedding: embResult.embedding,
                  p_user_id: effectiveUserId,
                  p_organization_id: orgId,
                  match_threshold: 0.5,
                  match_count: 5,
                });

              if (semanticMemories) {
                // Merge with recent, deduplicate by id
                const existingIds = new Set(recentMemories?.map((m: any) => m.id) || []);
                for (const sm of semanticMemories) {
                  if (!existingIds.has(sm.id)) {
                    memoriesForPrompt.push({
                      type: sm.memory_type,
                      content: sm.content,
                      date: sm.created_at,
                      importance: sm.importance_score,
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('[copilot-chat] Memory retrieval error:', e);
      }
    }

    // 6d. Fetch personalization fields if in personalization mode
    let personalizationFields: any[] = [];
    if (isPersonalizationMode) {
      try {
        const { data: templateData } = await supabaseAdmin
          .from('industry_voice_templates')
          .select('personalization_fields')
          .eq('industry_key', orgIndustry)
          .maybeSingle();

        if (templateData?.personalization_fields) {
          personalizationFields = templateData.personalization_fields;
        } else {
          // Fallback to general_business
          const { data: fallbackData } = await supabaseAdmin
            .from('industry_voice_templates')
            .select('personalization_fields')
            .eq('industry_key', 'general_business')
            .single();
          if (fallbackData?.personalization_fields) {
            personalizationFields = fallbackData.personalization_fields;
          }
        }
      } catch (e) {
        console.error('Failed to fetch personalization fields:', e);
      }
    }

    // 7. Build system prompt
    const conversationLength = body.conversationHistory?.length || 0;
    let systemPrompt = buildSystemPrompt(
      body.context,
      orgName,
      ragData,
      userRole,
      isVerifiedAdmin,
      body.userPreferences,
      body.hasUserProfile,
      planTier,
      conversationLength,
      isPersonalizationMode
    );

    // 7b. Inject persistent memories into system prompt
    if (memoriesForPrompt.length > 0) {
      const memoryLines = memoriesForPrompt
        .sort((a, b) => b.importance - a.importance)
        .map(m => `- [${m.type.toUpperCase()}] ${m.content} (${new Date(m.date).toLocaleDateString()})`)
        .join('\n');
      systemPrompt += `\n\n--- USER MEMORY (past interactions and learned preferences) ---\n${memoryLines}\n\nUse these memories naturally. Reference past decisions when relevant. Don't list memories back to the user.\n--- END USER MEMORY ---`;
    }

    if (body.context?.quarterbackMode && body.context?.insightType && body.context?.insightData) {
      systemPrompt += buildQuarterbackSystemPrompt(
        body.context.insightType,
        body.context.insightData,
        body.context.industry || 'general_business'
      );
    }

    if (isMeetingPrepMode) {
      systemPrompt += buildMeetingPrepSystemPrompt();
    }

    // 7c. Append personalization mode prompt if active
    if (isPersonalizationMode && personalizationFields.length > 0) {
      const pData = body.context?.personalizationData || {};
      systemPrompt += buildPersonalizationSystemPrompt(
        orgIndustry,
        personalizationFields,
        pData.currentValues || {},
        pData.agentName || '',
        pData.businessName || orgName
      );
    }

    if (isContextSummaryMode) {
      systemPrompt += CONTEXT_SUMMARY_PROMPT;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    if (body.conversationHistory && body.conversationHistory.length > 0) {
      messages.push(...body.conversationHistory.slice(-10));
    }

    messages.push({ role: "user", content: body.message });

    // 8. Call OpenRouter
    const model = "google/gemini-2.0-flash-001";
    const isCustomerDetail = intent.domains.includes('customer_detail');
    const isQuarterback = !!body.context?.quarterbackMode;
    const maxResponseTokens = Math.min(
      isContextSummaryMode ? 800
        : isMeetingPrepMode ? 2000
        : isQuarterback ? 1500
        : isPersonalizationMode ? 1800
        : (intent.needsData ? 1024 : 1200),
      tokensRemaining
    );

    const openRouterPayload = {
      model,
      messages,
      max_tokens: maxResponseTokens,
      temperature: isContextSummaryMode ? 0.2
        : isMeetingPrepMode ? 0.4
        : isCustomerDetail ? 0.3
        : isQuarterback ? 0.6
        : isPersonalizationMode ? 0.5
        : 0.7,
    };

    let openRouterResponse: Response;
    try {
      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://crm.cxtrack.com",
          "X-Title": "CxTrack CRM",
        },
        body: JSON.stringify(openRouterPayload),
      });
    } catch (fetchErr) {
      return new Response(
        JSON.stringify({
          response: "Failed to connect to AI service.",
          tokensUsed: 0,
          tokensRemaining,
          tokensAllocated: tokenRecord.tokens_allocated,
          provider: "error",
          debug: `Fetch error: ${fetchErr}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText = await openRouterResponse.text();

    if (!openRouterResponse.ok) {
      return new Response(
        JSON.stringify({
          response: `AI service returned error ${openRouterResponse.status}. Debug info included.`,
          tokensUsed: 0,
          tokensRemaining,
          tokensAllocated: tokenRecord.tokens_allocated,
          provider: "error",
          debug: {
            status: openRouterResponse.status,
            statusText: openRouterResponse.statusText,
            body: rawText.substring(0, 500),
            model,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let aiResult: any;
    try {
      aiResult = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({
          response: "AI service returned invalid JSON.",
          tokensUsed: 0,
          tokensRemaining,
          tokensAllocated: tokenRecord.tokens_allocated,
          provider: "error",
          debug: { rawText: rawText.substring(0, 500) },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseContent = aiResult.choices?.[0]?.message?.content;
    if (!responseContent) {
      return new Response(
        JSON.stringify({
          response: "AI returned empty response.",
          tokensUsed: 0,
          tokensRemaining,
          tokensAllocated: tokenRecord.tokens_allocated,
          provider: "error",
          debug: { aiResult: JSON.stringify(aiResult).substring(0, 500) },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Deduct tokens
    const tokensUsedThisRequest = aiResult.usage?.total_tokens || estimateTokens(body.message + responseContent);

    await supabaseAdmin
      .from("ai_token_usage")
      .update({
        tokens_used: tokenRecord.tokens_used + tokensUsedThisRequest,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tokenRecord.id);

    // 10. Memory extraction (fire-and-forget, never blocks response)
    if (!isContextSummaryMode && !isPersonalizationMode && body.message.length > 20) {
      extractMemories(
        body.message,
        responseContent,
        effectiveUserId,
        orgId,
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        OPENROUTER_API_KEY!
      ).catch(e => console.error('[copilot-chat] Memory extraction failed:', e));
    }

    return new Response(
      JSON.stringify({
        response: responseContent,
        tokensUsed: tokensUsedThisRequest,
        tokensRemaining: Math.max(0, tokensRemaining - tokensUsedThisRequest),
        tokensAllocated: tokenRecord.tokens_allocated,
        provider: "openrouter",
        model,
        ragDomains: intent.needsData ? intent.domains : undefined,
        isAdminContext: isVerifiedAdmin || undefined,
        isQuarterbackMode: isQuarterback || undefined,
        isPersonalizationMode: isPersonalizationMode || undefined,
        isContextSummary: isContextSummaryMode || undefined,
        isImpersonated: (effectiveUserId !== user.id) || undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", debug: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// =====================================================
// MEMORY EXTRACTION (fire-and-forget after each response)
// =====================================================
async function extractMemories(
  userMessage: string,
  aiResponse: string,
  userId: string,
  orgId: string,
  supabaseUrl: string,
  serviceKey: string,
  openRouterKey: string
): Promise<void> {
  // Skip short exchanges, greetings, and admin queries
  if (userMessage.length < 30 && aiResponse.length < 100) return;
  const skipPatterns = [/^(hi|hello|hey|thanks|ok|bye)/i, /^how('s| is) the (platform|system)/i];
  if (skipPatterns.some(p => p.test(userMessage.trim()))) return;

  const extractionPrompt = `Analyze this CRM conversation exchange and extract up to 3 memorable facts worth remembering for future conversations.

USER MESSAGE: "${userMessage}"

AI RESPONSE: "${aiResponse.substring(0, 1000)}"

Extract ONLY significant items that fall into these categories:
- decision: Strategic or business decisions made (importance: 0.8-1.0)
- preference: User preferences, workflows, or style choices (importance: 0.5-0.7)
- context: Business context, goals, or situational info (importance: 0.3-0.5)
- insight: Data patterns or business insights discussed (importance: 0.4-0.6)
- action_taken: Actions the user confirmed taking (importance: 0.6-0.8)

Return a JSON array (empty if nothing worth remembering):
[{"type":"decision","content":"User decided to focus on enterprise clients this quarter","importance":0.85,"expires_days":90}]

Rules:
- Only extract genuinely memorable facts, not transient queries
- "content" should be a clear, self-contained statement
- expires_days: null for permanent, 30-90 for time-sensitive context
- Return [] for routine data lookups, greetings, or generic questions
- Max 3 items per exchange`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: extractionPrompt }],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return;

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return;

    let memories: Array<{type: string; content: string; importance: number; expires_days?: number | null}>;
    try {
      const parsed = JSON.parse(content);
      memories = Array.isArray(parsed) ? parsed : parsed.memories || parsed.items || [];
    } catch {
      return;
    }

    if (!memories.length) return;

    const admin = createClient(supabaseUrl, serviceKey);
    const sourceSummary = userMessage.substring(0, 200);

    for (const mem of memories.slice(0, 3)) {
      if (!mem.content || mem.content.length < 10) continue;

      // Insert memory
      const { data: inserted, error: insertErr } = await admin
        .from('copilot_memory')
        .insert({
          user_id: userId,
          organization_id: orgId,
          memory_type: mem.type || 'context',
          content: mem.content,
          source_summary: sourceSummary,
          importance_score: Math.min(1, Math.max(0, mem.importance || 0.5)),
          expires_at: mem.expires_days
            ? new Date(Date.now() + mem.expires_days * 86400000).toISOString()
            : null,
        })
        .select('id')
        .single();

      if (insertErr || !inserted) continue;

      // Generate embedding for the memory (fire-and-forget)
      fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: mem.content,
          table_name: 'copilot_memory',
          record_id: inserted.id,
          organization_id: orgId,
        }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[copilot-chat] extractMemories error:', e);
  }
}