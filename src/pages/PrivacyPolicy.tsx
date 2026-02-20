import React, { useState } from 'react';
import {
  Shield, Lock, Eye, Cookie, Database, Globe, Info, ArrowLeft, Users,
  Brain, Mic, Server, Clock, AlertTriangle, Baby, Scale, ChevronDown, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'February 19, 2026';

const TOC_ITEMS = [
  { id: 'introduction', label: 'Introduction & Roles', icon: Info },
  { id: 'legal-basis', label: 'Legal Basis', icon: Scale },
  { id: 'data-collection', label: 'Information We Collect', icon: Database },
  { id: 'data-usage', label: 'How We Use Data', icon: Eye },
  { id: 'ai-disclosures', label: 'AI Disclosures', icon: Brain },
  { id: 'voice-recording', label: 'Voice & Calls', icon: Mic },
  { id: 'third-party', label: 'Third-Party Recipients', icon: Server },
  { id: 'cookies', label: 'Cookies & Tracking', icon: Cookie },
  { id: 'security', label: 'Data Security', icon: Lock },
  { id: 'transfers', label: 'International Transfers', icon: Globe },
  { id: 'retention', label: 'Data Retention', icon: Clock },
  { id: 'breach', label: 'Breach Notification', icon: AlertTriangle },
  { id: 'children', label: "Children's Privacy", icon: Baby },
  { id: 'compliance', label: 'Regulatory Compliance', icon: FileText },
  { id: 'rights', label: 'Your Privacy Rights', icon: Users },
  { id: 'contact', label: 'Contact', icon: Shield },
];

const SectionHeader = ({ icon: Icon, title, id }: { icon: React.ElementType; title: string; id: string }) => (
  <div className="flex items-center gap-3 mb-6" id={id}>
    <div className="p-2 bg-[#FFD700]/10 rounded-lg">
      <Icon className="w-5 h-5 text-[#FFD700]" />
    </div>
    <h2 className="text-2xl font-bold text-white">{title}</h2>
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-white/60 leading-relaxed mb-4">{children}</p>
);

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-white/80">{children}</strong>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-white/60 text-sm ml-4 list-disc mb-4">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

const CheckIcon = ({ className }: { className: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const PrivacyPolicy: React.FC = () => {
  const [tocOpen, setTocOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 scroll-smooth">
      <div className="max-w-5xl mx-auto">

        {/* Logo */}
        <div className="mb-8">
          <Link to="/">
            <img src="/cx-icon.png" alt="CxTrack" className="h-10 opacity-90 hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#FFD700]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/40 mb-2">Last updated: {LAST_UPDATED}</p>
          <p className="text-white/30 text-sm max-w-xl mx-auto">
            How CxTrack Inc. collects, uses, and protects your information.
          </p>
        </div>

        <div className="flex gap-8">

          {/* Sticky ToC — Desktop */}
          <nav className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8 bg-white/[0.03] rounded-2xl border border-white/[0.08] p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 px-3">Contents</p>
              {TOC_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg text-white/40 hover:text-[#FFD700] hover:bg-white/[0.03] transition-colors text-sm"
                >
                  <item.icon size={14} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Mobile ToC */}
            <div className="lg:hidden mb-8">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.08] text-white/60 text-sm font-medium"
              >
                <span>Table of Contents</span>
                <ChevronDown size={16} className={`transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
              </button>
              {tocOpen && (
                <div className="mt-2 bg-white/[0.03] rounded-2xl border border-white/[0.08] p-4 space-y-1">
                  {TOC_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg text-white/40 hover:text-[#FFD700] text-sm"
                    >
                      <item.icon size={14} className="shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="p-8 space-y-12">

                {/* 1. Introduction & Roles */}
                <section>
                  <SectionHeader icon={Info} title="1. Introduction & Our Roles" id="introduction" />
                  <P><Strong>CxTrack Inc.</Strong> (&quot;CxTrack&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), incorporated under the laws of Ontario, Canada, operates the CxTrack CRM platform. This Privacy Policy explains how we collect, use, disclose, and safeguard information in connection with the Service. We are committed to protecting the privacy of all individuals whose data passes through our platform.</P>

                  <P>CxTrack interacts with three distinct categories of individuals, and our legal role differs for each:</P>

                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Who</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Definition</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">CxTrack&apos;s Role</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-[#FFD700]/70">User (You)</td>
                          <td className="py-3 px-4">The person or entity that creates a CxTrack account and uses the platform.</td>
                          <td className="py-3 px-4 font-medium text-white/70">Data Controller</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-[#FFD700]/70">Customer</td>
                          <td className="py-3 px-4">The contacts, leads, and clients that you store inside the CRM.</td>
                          <td className="py-3 px-4 font-medium text-white/70">Data Processor</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-[#FFD700]/70">Caller</td>
                          <td className="py-3 px-4">People who call or are called via CxTrack&apos;s voice agent feature.</td>
                          <td className="py-3 px-4 font-medium text-white/70">Sub-Processor</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>What this means:</Strong> We directly control how we handle your account data (Controller). For the contacts and business data you enter into the CRM, we only process it on your behalf to provide the service — you decide what data to store and are responsible for your data subjects&apos; rights (we are the Processor, you are the Controller). For call recordings via our voice agent, we act as a Sub-Processor through Retell AI and Twilio — it is your responsibility to obtain consent from callers.</p>
                  </div>
                </section>

                {/* 2. Legal Basis */}
                <section>
                  <SectionHeader icon={Scale} title="2. Legal Basis for Processing" id="legal-basis" />
                  <P>We process data under the following legal bases, varying by data subject:</P>

                  <div className="space-y-3 mb-4">
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">User Data — Contract Performance & Legitimate Interests</p>
                      <p className="text-white/50 text-sm">We process your account information because it is necessary to perform our contract with you (providing the CRM service) and for our legitimate interests in operating, improving, and securing the platform.</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">Customer Data — Data Processing Agreement</p>
                      <p className="text-white/50 text-sm">We process the contacts and business data you enter into the CRM on your behalf. You are the Controller and must have a lawful basis for collecting and storing your customers&apos; data. We process it solely to provide the Service.</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">Caller Data — Your Consent Obligation</p>
                      <p className="text-white/50 text-sm">Call recordings and transcripts are processed on your behalf via Retell AI and Twilio. You are responsible for obtaining caller consent where required by law.</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">Cookies — Consent</p>
                      <p className="text-white/50 text-sm">Non-essential cookies are placed only with your explicit consent via our cookie consent banner. Essential cookies are used under legitimate interest.</p>
                    </div>
                  </div>
                </section>

                {/* 3. Information We Collect */}
                <section>
                  <SectionHeader icon={Database} title="3. Information We Collect" id="data-collection" />

                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
                    User Data (collected directly from you)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {[
                      { title: 'Identity Data', items: ['Name, email address, phone number', 'Company name and job title', 'Profile photo and preferences'] },
                      { title: 'Financial Data', items: ['Payment method details (processed by Stripe — we do not store credit card numbers)', 'Billing address and invoicing history', 'Subscription tier and billing cycle'] },
                      { title: 'Technical Data', items: ['IP address, browser type, device info', 'Operating system and screen resolution', 'Login timestamps and session data'] },
                      { title: 'Usage Data', items: ['Features accessed and frequency of use', 'CoPilot AI queries and token consumption', 'Navigation patterns and click events'] },
                      { title: 'Communication Data', items: ['Support tickets and email correspondence', 'In-app chat messages', 'Feedback and survey responses'] },
                    ].map(group => (
                      <div key={group.title} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        <p className="text-white font-semibold text-sm mb-2">{group.title}</p>
                        <ul className="space-y-1 text-white/50 text-xs">
                          {group.items.map((item, i) => <li key={i}>• {item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
                    Customer Data (entered by you into the CRM)
                  </h3>
                  <P>This includes any contacts, leads, deals, invoices, notes, tasks, pipeline items, quotes, products, and other business data you choose to store. CxTrack does not independently collect this data — you input it, and you are the Controller.</P>

                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
                    Caller Data (generated through voice agents)
                  </h3>
                  <P>When your CxTrack voice agent handles calls, the following data is generated: call recordings (audio), transcripts (text), AI-generated call summaries, extracted action items and key topics, call duration and metadata (phone numbers, timestamps).</P>
                </section>

                {/* 4. How We Use Data */}
                <section>
                  <SectionHeader icon={Eye} title="4. How We Use Your Information" id="data-usage" />
                  <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06] mb-4">
                    <ul className="grid md:grid-cols-2 gap-4 text-white/60 text-sm">
                      {[
                        'To provide, operate, and maintain the CRM platform',
                        'To process subscriptions and billing through Stripe',
                        'To send transactional emails (account confirmations, invoices, alerts)',
                        'To provide AI-powered features (CoPilot, call summaries, receipt scanning)',
                        'To provision and manage voice agents and phone numbers',
                        'To analyze usage patterns and improve the Service',
                        'To protect against fraud, abuse, and security threats',
                        'To comply with legal obligations and respond to lawful requests',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-[#FFD700] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10">
                    <p className="text-sm text-white/60"><Strong>Customer Data Use Restriction.</Strong> We process your Customer Data (CRM contacts, deals, invoices, etc.) solely to provide the Service. We do not use Customer Data for marketing, advertising, profiling, AI model training, or any purpose unrelated to service delivery. We do not sell Customer Data to third parties under any circumstances.</p>
                  </div>
                </section>

                {/* 5. AI Disclosures */}
                <section>
                  <SectionHeader icon={Brain} title="5. AI & Automation Disclosures" id="ai-disclosures" />
                  <P>CxTrack uses artificial intelligence to power several features. Here is how AI interacts with your data:</P>
                  <BulletList items={[
                    'CoPilot AI: Your natural language queries and relevant CRM context (Customer Data) are sent to Google Gemini (via OpenRouter) to generate responses. Queries are not used to train third-party AI models.',
                    'Call Summaries: Call transcripts are processed by AI to generate summaries, extract action items, and identify sentiment. The AI model does not retain this data beyond the processing session.',
                    'Receipt Scanning: Receipt images are sent to AI vision models for data extraction. Images are processed in real-time and not stored by the AI provider.',
                    'Customer Insights: AI analyzes your CRM data to provide business intelligence. Analysis is performed using your data in context and is not shared across accounts.',
                  ]} />
                  <P><Strong>Token System.</Strong> AI features consume tokens from your monthly allocation (which varies by subscription tier). Token usage is tracked per-user and displayed in your account. We do not sell or share your AI interaction data.</P>
                  <P><Strong>No Personal Data Sales.</Strong> CxTrack does not sell, rent, or trade your personal data or Customer Data to AI providers or any other third party for their own purposes.</P>
                </section>

                {/* 6. Voice & Calls */}
                <section>
                  <SectionHeader icon={Mic} title="6. Voice & Call Recording" id="voice-recording" />
                  <P>When you use CxTrack&apos;s voice agent features:</P>
                  <BulletList items={[
                    'Calls are recorded and transcribed by Retell AI, with telephony infrastructure provided by Twilio.',
                    'Call recordings are retained for 90 days before automatic deletion.',
                    'AI-generated summaries, action items, and key topics are retained for the duration of your subscription.',
                    'Call metadata (phone numbers, timestamps, duration) is stored for billing and analytics purposes.',
                  ]} />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Your Responsibility.</Strong> You are the Data Controller for Caller Data. You must inform callers that calls may be recorded and transcribed. In jurisdictions requiring two-party consent, you must obtain such consent. CxTrack provides configurable disclosure messages but does not guarantee compliance with your local laws.</p>
                  </div>
                </section>

                {/* 7. Third-Party Recipients */}
                <section>
                  <SectionHeader icon={Server} title="7. Third-Party Recipients" id="third-party" />
                  <P>We share data with the following service providers to deliver the platform:</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-3 text-white/60 font-semibold">Service</th>
                          <th className="text-left py-3 px-3 text-white/60 font-semibold">Purpose</th>
                          <th className="text-left py-3 px-3 text-white/60 font-semibold">Data Subjects</th>
                          <th className="text-left py-3 px-3 text-white/60 font-semibold">Location</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        {[
                          ['Stripe', 'Payment processing', 'Users', 'US'],
                          ['OpenRouter / Gemini', 'AI features', 'Users, Customers', 'US'],
                          ['Retell AI', 'Voice agents', 'Users, Callers', 'US'],
                          ['Twilio', 'Telephony & SMS', 'Users, Callers', 'US'],
                          ['Google Cloud Vision', 'OCR (receipts, cards)', 'Users', 'US'],
                          ['Resend', 'Email delivery', 'Users', 'US'],
                          ['Supabase / AWS', 'Infrastructure', 'All', 'Canada'],
                        ].map(([service, purpose, subjects, location], i) => (
                          <tr key={i} className="border-b border-white/[0.04]">
                            <td className="py-3 px-3 font-medium text-white/70">{service}</td>
                            <td className="py-3 px-3">{purpose}</td>
                            <td className="py-3 px-3">{subjects}</td>
                            <td className="py-3 px-3">{location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <P>Each provider is bound by their own privacy policies and data processing agreements. We select providers that maintain appropriate security standards.</P>
                </section>

                {/* 8. Cookies */}
                <section>
                  <SectionHeader icon={Cookie} title="8. Cookies & Tracking" id="cookies" />
                  <P>We use cookies and similar technologies on the CRM platform. Cookies apply to Users only — Customers and Callers do not interact with our cookies.</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Type</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">Essential</td>
                          <td className="py-3 px-4">Authentication, session management, CSRF protection</td>
                          <td className="py-3 px-4">Session / 7 days</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">Preferences</td>
                          <td className="py-3 px-4">Theme selection, sidebar order, cookie consent choice</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">Analytics</td>
                          <td className="py-3 px-4">Usage patterns, feature adoption, performance monitoring</td>
                          <td className="py-3 px-4">90 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <P>You can manage your cookie preferences through our cookie consent banner or your browser settings. Essential cookies cannot be disabled as they are required for the platform to function.</P>
                </section>

                {/* 9. Data Security */}
                <section>
                  <SectionHeader icon={Lock} title="9. Data Security" id="security" />
                  <P>We implement industry-standard security measures to protect your data:</P>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {[
                      'TLS/SSL encryption in transit',
                      'AES-256 encryption at rest',
                      'Row-level security (RLS) on all database tables',
                      'Role-based access controls',
                      'Regular security assessments',
                      'Automated daily backups',
                      'DDoS mitigation and rate limiting',
                      'JWT-based authentication with token rotation',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg text-sm text-white/60 border border-white/[0.06]">
                        <Shield className="w-4 h-4 text-[#FFD700]/60 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <P>While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but will promptly address any vulnerabilities discovered.</P>
                </section>

                {/* 10. International Transfers */}
                <section>
                  <SectionHeader icon={Globe} title="10. International Data Transfers" id="transfers" />
                  <P><Strong>Primary Storage.</Strong> All User Data and Customer Data is stored in Canada (AWS ca-central-1, Montreal) via our infrastructure provider, Supabase.</P>
                  <P><Strong>Processing via US Services.</Strong> Some data is transmitted to US-based service providers for processing:</P>
                  <BulletList items={[
                    'AI queries are processed through OpenRouter / Google Gemini (US).',
                    'Call recordings are processed through Retell AI and Twilio (US).',
                    'Payments are processed through Stripe (US).',
                    'Emails are delivered through Resend (US).',
                  ]} />
                  <P>Where data is transferred outside Canada, we ensure appropriate safeguards are in place, including contractual protections with our sub-processors that require them to protect data to standards equivalent to Canadian privacy law.</P>
                </section>

                {/* 11. Data Retention */}
                <section>
                  <SectionHeader icon={Clock} title="11. Data Retention" id="retention" />
                  <P>We retain data for only as long as necessary to fulfill the purposes outlined in this policy:</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Data Type</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Retention Period</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        {[
                          ['User account data', 'Duration of subscription + 60 days'],
                          ['Customer Data (CRM contacts)', 'Duration of subscription + 60 days (deleted with account)'],
                          ['Call recordings (audio)', '90 days from recording date'],
                          ['Call transcripts & summaries', 'Duration of subscription'],
                          ['AI interaction logs', '90 days'],
                          ['Payment records', '7 years (legal requirement)'],
                          ['System backups', '30 days (rolling)'],
                          ['Cookie consent records', '1 year'],
                        ].map(([type, period], i) => (
                          <tr key={i} className="border-b border-white/[0.04]">
                            <td className="py-3 px-4 font-medium text-white/70">{type}</td>
                            <td className="py-3 px-4">{period}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <P>After the retention period, data is permanently deleted and cannot be recovered. You may request earlier deletion by contacting privacy@cxtrack.com, subject to any legal retention obligations.</P>
                </section>

                {/* 12. Breach Notification */}
                <section>
                  <SectionHeader icon={AlertTriangle} title="12. Data Breach Notification" id="breach" />
                  <P><Strong>Our Commitment.</Strong> In the event of a security breach that affects personal data, CxTrack will:</P>
                  <BulletList items={[
                    'Notify affected Users without undue delay, and no later than 72 hours after becoming aware of the breach (where GDPR applies).',
                    'Provide details of: the nature of the breach, categories and approximate number of records affected, likely consequences, and measures taken to address the breach.',
                    'Notify the Office of the Privacy Commissioner of Canada where required under PIPEDA.',
                  ]} />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Your Responsibility for Customer Data Breaches.</Strong> If a breach affects Customer Data (your CRM contacts, invoices, deals, etc.), CxTrack will notify you as the Data Controller. <span className="text-[#FFD700]/70">You are solely responsible for: (a) assessing the impact on your data subjects; (b) notifying the relevant supervisory authorities or privacy regulators as required by applicable law in your jurisdiction; and (c) communicating the breach to your affected customers and callers.</span> CxTrack&apos;s notification obligation is to you — not to your customers, callers, or regulators — unless independently required by law.</p>
                  </div>
                </section>

                {/* 13. Children's Privacy */}
                <section>
                  <SectionHeader icon={Baby} title="13. Children's Privacy" id="children" />
                  <P>CxTrack is a business-to-business platform not directed at individuals under the age of 18. We do not knowingly collect personal information from children under 13 (as defined by COPPA) or under 16 (as defined by GDPR).</P>
                  <P>If we discover that we have inadvertently collected data from a child, we will promptly delete it. If you believe we may have collected information from a child, please contact privacy@cxtrack.com.</P>
                  <P>Users must not store personal data of children under 13 in the CRM unless they have a lawful basis and appropriate parental consent as required by applicable law.</P>
                </section>

                {/* 14. Regulatory Compliance */}
                <section>
                  <SectionHeader icon={FileText} title="14. Regulatory Compliance" id="compliance" />
                  <div className="space-y-3 mb-4">
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">PIPEDA (Canada)</p>
                      <p className="text-white/50 text-sm">As a Canadian company, CxTrack complies with the Personal Information Protection and Electronic Documents Act. We adhere to PIPEDA&apos;s 10 fair information principles including accountability, consent, limiting collection, and individual access.</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">CCPA (California, US)</p>
                      <p className="text-white/50 text-sm">California residents have additional rights including: the right to know what personal information is collected, the right to delete, the right to opt-out of data sales (we do not sell data), and the right to non-discrimination for exercising privacy rights.</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                      <p className="text-white font-semibold text-sm mb-1">GDPR (European Union)</p>
                      <p className="text-white/50 text-sm">If you are located in the EU/EEA, additional rights apply including: right to access, rectification, erasure, restriction of processing, data portability, and the right to object. Our lawful bases for processing are outlined in Section 2.</p>
                    </div>
                  </div>
                </section>

                {/* 15. Your Rights */}
                <section>
                  <SectionHeader icon={Users} title="15. Your Privacy Rights" id="rights" />
                  <P>Depending on your location and applicable law, you may have the following rights regarding your personal data:</P>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {[
                      { right: 'Right of Access', desc: 'Request a copy of all personal data we hold about you.' },
                      { right: 'Right to Correction', desc: 'Request correction of inaccurate or incomplete data.' },
                      { right: 'Right to Deletion', desc: 'Request deletion of your personal data (subject to legal retention).' },
                      { right: 'Right to Restriction', desc: 'Request that we limit processing of your data in certain circumstances.' },
                      { right: 'Right to Portability', desc: 'Receive your data in a structured, machine-readable format.' },
                      { right: 'Right to Object', desc: 'Object to processing based on legitimate interests or for marketing.' },
                      { right: 'Right to Withdraw Consent', desc: 'Withdraw consent at any time where processing is based on consent.' },
                      { right: 'Right to Complain', desc: 'Lodge a complaint with a supervisory authority in your jurisdiction.' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 border border-white/[0.06] rounded-xl">
                        <p className="text-white font-semibold text-sm mb-1">{item.right}</p>
                        <p className="text-white/40 text-xs">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <P><Strong>How to Exercise Your Rights.</Strong> Send a request to privacy@cxtrack.com with the subject line &quot;Privacy Rights Request&quot;. We will respond within 30 days (PIPEDA/GDPR) or 45 days (CCPA). We may request identity verification before processing your request.</P>
                  <P><Strong>Customer Data Requests.</Strong> If you receive a data subject access request from one of your CRM contacts (Customers), you are responsible for responding as the Controller. CxTrack will assist you in fulfilling such requests upon reasonable notice.</P>
                </section>

                {/* 16. Contact */}
                <section>
                  <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FFD700]/10 text-center" id="contact">
                    <h3 className="text-xl font-bold text-white mb-3">Questions or Concerns?</h3>
                    <p className="text-white/40 mb-6 max-w-lg mx-auto leading-relaxed">
                      For questions about this Privacy Policy, data practices, or to exercise your privacy rights, contact our Data Protection team.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.08] text-white/60">
                        <strong className="text-[#FFD700]/80">Privacy:</strong> privacy@cxtrack.com
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.08] text-white/60">
                        <strong className="text-[#FFD700]/80">Support:</strong> support@cxtrack.com
                      </div>
                    </div>
                    <p className="text-white/20 text-xs mt-6">CxTrack Inc. &middot; Ontario, Canada</p>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#FFD700]/60 hover:text-[#FFD700] font-semibold group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
