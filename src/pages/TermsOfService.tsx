import React, { useState } from 'react';
import {
  Scale, Shield, Info, Users, CreditCard, Ban, Copyright, Phone, Brain,
  Mic, Server, Database, Lock, AlertTriangle, FileWarning, Trash2, Zap,
  Gavel, RefreshCw, ArrowLeft, ChevronDown, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'February 19, 2026';

const TOC_ITEMS = [
  { id: 'definitions', label: 'Definitions & Scope', icon: Info },
  { id: 'eligibility', label: 'Account Eligibility', icon: Users },
  { id: 'subscriptions', label: 'Subscription Plans', icon: CreditCard },
  { id: 'acceptable-use', label: 'Acceptable Use', icon: Ban },
  { id: 'intellectual-property', label: 'Intellectual Property', icon: Copyright },
  { id: 'phone-numbers', label: 'Phone Numbers', icon: Phone },
  { id: 'ai-disclosure', label: 'AI & Automation', icon: Brain },
  { id: 'voice-recording', label: 'Voice Recording', icon: Mic },
  { id: 'third-party', label: 'Third-Party Services', icon: Server },
  { id: 'data-processing', label: 'Data Processing', icon: Database },
  { id: 'confidentiality', label: 'Confidentiality', icon: Lock },
  { id: 'liability', label: 'Limitation of Liability', icon: AlertTriangle },
  { id: 'indemnification', label: 'Indemnification', icon: Shield },
  { id: 'warranties', label: 'Warranties', icon: FileWarning },
  { id: 'termination', label: 'Termination', icon: Trash2 },
  { id: 'sla', label: 'Service Level', icon: Zap },
  { id: 'disputes', label: 'Dispute Resolution', icon: Gavel },
  { id: 'modifications', label: 'Modifications', icon: RefreshCw },
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

export const TermsOfService: React.FC = () => {
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
            <Scale className="w-8 h-8 text-[#FFD700]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/40 mb-2">Last updated: {LAST_UPDATED}</p>
          <p className="text-white/30 text-sm max-w-xl mx-auto">
            This Terms of Service agreement is a legally binding contract between you and CxTrack Inc.
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

                {/* 1. Definitions */}
                <section>
                  <SectionHeader icon={Info} title="1. Definitions & Scope" id="definitions" />
                  <P>These Terms of Service (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding contract between you (&quot;User&quot;, &quot;you&quot;, &quot;your&quot;) and <Strong>CxTrack Inc.</Strong>, a company incorporated under the laws of Ontario, Canada (&quot;CxTrack&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;).</P>
                  <P>This Agreement governs your access to and use of the CxTrack platform, including all associated software, applications, AI features, voice agent services, APIs, and related documentation (collectively, the &quot;Service&quot;). By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.</P>
                  <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06] mb-4">
                    <p className="text-sm text-white/50"><Strong>Key Definitions:</Strong></p>
                    <ul className="space-y-2 text-white/50 text-sm mt-3">
                      <li><Strong>&quot;User&quot;</Strong> — The individual or entity that creates and maintains a CxTrack account.</li>
                      <li><Strong>&quot;Organization&quot;</Strong> — The business entity associated with a User&apos;s account.</li>
                      <li><Strong>&quot;Customer Data&quot;</Strong> — All contacts, leads, deals, invoices, notes, and other business data entered into the CRM by the User.</li>
                      <li><Strong>&quot;Caller&quot;</Strong> — Any person who interacts with a voice agent provisioned through the Service.</li>
                      <li><Strong>&quot;Platform&quot;</Strong> — The CxTrack web application, APIs, AI features, and voice infrastructure.</li>
                    </ul>
                  </div>
                </section>

                {/* 2. Eligibility */}
                <section>
                  <SectionHeader icon={Users} title="2. Account Eligibility" id="eligibility" />
                  <P>To use the Service, you must:</P>
                  <BulletList items={[
                    'Be at least 18 years of age or the age of legal majority in your jurisdiction.',
                    'Provide accurate, current, and complete registration information.',
                    'Have the legal authority to bind your organization to these Terms.',
                    'Maintain the security and confidentiality of your account credentials.',
                    'Promptly notify CxTrack of any unauthorized use of your account.',
                  ]} />
                  <P>You are responsible for all activities that occur under your account, whether or not authorized by you. CxTrack reserves the right to suspend or terminate accounts that contain false or misleading information.</P>
                </section>

                {/* 3. Subscriptions */}
                <section>
                  <SectionHeader icon={CreditCard} title="3. Subscription Plans" id="subscriptions" />
                  <P>CxTrack offers the following subscription tiers:</P>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { name: 'Free', desc: 'Full access to all features for 30 days. After the trial period, premium features are locked until you upgrade.' },
                      { name: 'Business', desc: 'Monthly subscription with access to core CRM, AI CoPilot, and voice agent features.' },
                      { name: 'Elite Premium', desc: 'Enhanced limits, priority support, and advanced AI token allocation.' },
                      { name: 'Enterprise', desc: 'Custom configuration, dedicated support, and bespoke deployment options.' },
                    ].map(plan => (
                      <div key={plan.name} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        <p className="text-white font-bold text-sm mb-1">{plan.name}</p>
                        <p className="text-white/40 text-xs">{plan.desc}</p>
                      </div>
                    ))}
                  </div>
                  <P><Strong>Billing.</Strong> Paid subscriptions are billed monthly in advance via Stripe. All fees are quoted in USD unless otherwise specified. By subscribing to a paid plan, you authorize CxTrack to charge the applicable fees to your designated payment method on a recurring basis.</P>
                  <P><Strong>Auto-Renewal.</Strong> Subscriptions automatically renew at the end of each billing period unless cancelled prior to the renewal date. You may cancel at any time from your dashboard settings.</P>
                  <P><Strong>Refunds.</Strong> All fees are non-refundable except where required by applicable law. No prorated refunds will be issued for partial billing periods.</P>
                  <P><Strong>Price Changes.</Strong> CxTrack reserves the right to modify pricing with 30 days written notice. Your continued use after a price change constitutes acceptance of the new pricing.</P>
                </section>

                {/* 4. Acceptable Use */}
                <section>
                  <SectionHeader icon={Ban} title="4. Acceptable Use Policy" id="acceptable-use" />
                  <P>You agree not to use the Service to:</P>
                  <BulletList items={[
                    'Violate any applicable local, provincial, national, or international law or regulation.',
                    'Store, process, or transmit any data subject to the Payment Card Industry Data Security Standard (PCI DSS), including credit card numbers or financial account credentials.',
                    'Store protected health information (PHI) subject to HIPAA or similar healthcare privacy regulations.',
                    'Store Social Insurance Numbers (SIN), Social Security Numbers (SSN), or government-issued identification numbers.',
                    'Send unsolicited bulk communications (spam) or engage in any form of harassment.',
                    'Distribute malware, viruses, or any code designed to disrupt, damage, or limit functionality.',
                    'Impersonate any person, entity, or falsely represent your affiliation with any entity.',
                    'Interfere with or disrupt the integrity or performance of the Service.',
                  ]} />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Anti-Scraping & Automated Access Prohibition.</Strong> You shall not use any automated means — including but not limited to bots, crawlers, scrapers, spiders, data mining tools, screen scraping software, or any other automated technology — to access, extract, copy, index, monitor, or collect any content, data, or information from the CxTrack platform. This prohibition includes accessing our APIs outside of documented and authorized use, systematic downloading of records, and any activity intended to replicate, compete with, or derive commercial value from the Service or its data. Violation of this provision constitutes a material breach of these Terms and may result in immediate account termination and legal action.</p>
                  </div>
                  <BulletList items={[
                    'Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Service.',
                    'Sublicense, resell, lease, or redistribute access to the Service to any third party.',
                    'Remove, alter, or obscure any proprietary notices, labels, or marks on the Service.',
                    'Use the Service for benchmarking or competitive analysis purposes.',
                  ]} />
                </section>

                {/* 5. Intellectual Property */}
                <section>
                  <SectionHeader icon={Copyright} title="5. Intellectual Property" id="intellectual-property" />
                  <P><Strong>CxTrack&apos;s Intellectual Property.</Strong> The Service, including all software, code, algorithms, designs, interfaces, documentation, trademarks, logos, and content, is the exclusive property of CxTrack Inc. and is protected by Canadian and international intellectual property laws. No rights are granted to you other than the limited license to use the Service as described in these Terms.</P>
                  <P><Strong>Your Data.</Strong> You retain all rights, title, and interest in and to your Customer Data. CxTrack does not claim ownership over any data you enter into the platform. We are granted a limited, non-exclusive license to process your Customer Data solely for the purpose of providing and improving the Service.</P>
                  <P><Strong>Feedback.</Strong> Any suggestions, ideas, enhancement requests, or other feedback you provide regarding the Service may be used by CxTrack without restriction, attribution, or compensation.</P>
                </section>

                {/* 6. Phone Numbers */}
                <section>
                  <SectionHeader icon={Phone} title="6. Phone Numbers & Telephony" id="phone-numbers" />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Ownership of Phone Numbers.</Strong> All telephone numbers provisioned through the CxTrack platform remain the exclusive property of CxTrack Inc. Phone numbers are licensed to you for use solely during your active subscription period. You do not acquire any ownership interest, right, title, or claim to any phone number assigned to your account.</p>
                  </div>
                  <P><Strong>Revocation.</Strong> Upon termination, cancellation, or expiration of your subscription, all phone numbers associated with your account will be immediately reclaimed by CxTrack. You will have no further right to use, reference, or port such numbers.</P>
                  <P><Strong>Number Porting.</Strong> Porting of CxTrack-provisioned phone numbers to external carriers or services is not permitted without prior written consent from CxTrack Inc.</P>
                  <P><Strong>Telephony Use.</Strong> You agree to use telephony services in compliance with all applicable telecommunications regulations, including the Canadian Radio-television and Telecommunications Commission (CRTC) regulations, the Telephone Consumer Protection Act (TCPA), and any applicable do-not-call legislation.</P>
                </section>

                {/* 7. AI & Automation */}
                <section>
                  <SectionHeader icon={Brain} title="7. AI & Automation Disclosure" id="ai-disclosure" />
                  <P>CxTrack incorporates artificial intelligence features including:</P>
                  <BulletList items={[
                    'CoPilot AI — An AI-powered assistant that helps you manage your CRM data, answer questions, and perform actions.',
                    'Call Summaries — Automated transcription and summarization of voice agent calls.',
                    'Receipt Scanning — AI-powered extraction of data from receipt images.',
                    'Customer Insights — AI-generated analysis and recommendations based on your CRM data.',
                  ]} />
                  <P><Strong>Third-Party AI Services.</Strong> AI features are powered by third-party providers, currently including Google Gemini (accessed through OpenRouter). Your CRM data may be transmitted to these providers for processing. CxTrack does not sell your personal data to AI providers, and data transmitted for AI processing is not used to train third-party AI models.</P>
                  <P><Strong>Token System.</Strong> AI features are subject to monthly token allocations that vary by subscription tier. Token usage is tracked and displayed in your account. Unused tokens do not roll over between billing periods.</P>
                  <P><Strong>Accuracy Disclaimer.</Strong> AI-generated outputs are provided for informational purposes only and may contain errors, omissions, or inaccuracies. You are solely responsible for reviewing and verifying all AI outputs before relying on them for business decisions. CxTrack makes no warranty regarding the accuracy, completeness, or reliability of AI-generated content.</P>
                </section>

                {/* 8. Voice Recording */}
                <section>
                  <SectionHeader icon={Mic} title="8. Voice Recording & Call Consent" id="voice-recording" />
                  <P>By using CxTrack&apos;s voice agent features, you acknowledge and agree to the following:</P>
                  <BulletList items={[
                    'All calls handled by CxTrack voice agents are recorded and transcribed using Retell AI and Twilio telephony infrastructure.',
                    'Call recordings are processed by AI to generate summaries, extract action items, and identify key topics.',
                    'Call recordings are retained for 90 days, after which they are automatically deleted.',
                    'Transcripts and AI-generated summaries may be retained for the duration of your subscription.',
                  ]} />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Your Consent Obligations.</Strong> You are solely responsible for informing all callers that their calls may be recorded and transcribed. In jurisdictions that require two-party or all-party consent for call recording, it is your legal obligation to obtain such consent before or at the beginning of each call. CxTrack provides configurable call disclosure messages but does not guarantee compliance with the recording consent laws of your jurisdiction. You agree to indemnify CxTrack for any claims arising from your failure to obtain proper recording consent.</p>
                  </div>
                </section>

                {/* 9. Third-Party Services */}
                <section>
                  <SectionHeader icon={Server} title="9. Third-Party Services" id="third-party" />
                  <P>The Service relies on the following third-party providers to deliver functionality:</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Service</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Purpose</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Location</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        {[
                          ['Stripe', 'Payment processing', 'United States'],
                          ['OpenRouter / Google Gemini', 'AI features (CoPilot, summaries, OCR)', 'United States'],
                          ['Retell AI', 'Voice agent infrastructure', 'United States'],
                          ['Twilio', 'Telephony and SMS', 'United States'],
                          ['Google Cloud Vision', 'Business card and receipt OCR', 'United States'],
                          ['Resend', 'Transactional email delivery', 'United States'],
                          ['Supabase / AWS', 'Database and infrastructure', 'Canada (Montreal)'],
                        ].map(([service, purpose, location], i) => (
                          <tr key={i} className="border-b border-white/[0.04]">
                            <td className="py-3 px-4 font-medium text-white/70">{service}</td>
                            <td className="py-3 px-4">{purpose}</td>
                            <td className="py-3 px-4">{location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <P>Your use of the Service is also subject to the terms and privacy policies of these third-party providers. CxTrack is not responsible for the acts or omissions of any third-party provider.</P>
                </section>

                {/* 10. Data Processing */}
                <section>
                  <SectionHeader icon={Database} title="10. Data Processing & Roles" id="data-processing" />
                  <P>CxTrack operates under a three-tier data processing model:</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Data Type</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">CxTrack&apos;s Role</th>
                          <th className="text-left py-3 px-4 text-white/60 font-semibold">Your Role</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/50">
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">User Account Data</td>
                          <td className="py-3 px-4">Data Controller</td>
                          <td className="py-3 px-4">Data Subject</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">CRM Customer Data</td>
                          <td className="py-3 px-4">Data Processor</td>
                          <td className="py-3 px-4">Data Controller</td>
                        </tr>
                        <tr className="border-b border-white/[0.04]">
                          <td className="py-3 px-4 font-medium text-white/70">Caller / Call Data</td>
                          <td className="py-3 px-4">Sub-Processor</td>
                          <td className="py-3 px-4">Data Controller</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <P><Strong>Your Responsibilities as Controller.</Strong> For CRM Customer Data and Caller Data, you are the data controller. You are responsible for:</P>
                  <BulletList items={[
                    'Having a lawful basis for collecting and storing your customers\' personal data in the CRM.',
                    'Obtaining appropriate consent from callers for call recording where required by law.',
                    'Responding to data subject access requests from your customers and callers.',
                    'Complying with applicable data protection laws in your jurisdiction.',
                  ]} />
                  <P>CxTrack processes Customer Data and Caller Data solely for the purpose of providing the Service and will not use such data for marketing, profiling, or any purpose unrelated to service delivery.</P>

                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Data Breach Notification.</Strong> In the event of a security breach affecting Customer Data or Caller Data, CxTrack will notify you (the User) without undue delay and no later than 72 hours after becoming aware of the breach. The notification will include: (a) the nature of the breach; (b) the categories and approximate number of data records affected; (c) the measures taken or proposed to address the breach. <span className="text-[#FFD700]/70">As the Data Controller for your Customer Data and Caller Data, you are solely responsible for: (i) assessing the impact of the breach on your data subjects; (ii) notifying the relevant supervisory authorities or privacy regulators as required by applicable law; and (iii) communicating the breach to affected data subjects where required.</span> CxTrack&apos;s obligation is limited to notifying you — not your customers, callers, or regulators — unless CxTrack is independently required to do so by law.</p>
                  </div>
                </section>

                {/* 11. Confidentiality */}
                <section>
                  <SectionHeader icon={Lock} title="11. Confidentiality" id="confidentiality" />
                  <P>Each party agrees to hold the other&apos;s confidential information in strict confidence and not to disclose such information to any third party, except as required to perform under these Terms or as required by law.</P>
                  <P><Strong>CxTrack&apos;s Commitment.</Strong> We will not access, view, or use your Customer Data except as necessary to provide the Service, resolve support requests you initiate, or comply with legal obligations. Our personnel are bound by confidentiality obligations.</P>
                  <P><Strong>Exclusions.</Strong> Confidentiality obligations do not apply to information that: (a) is publicly available through no fault of the receiving party; (b) was known to the receiving party prior to disclosure; (c) is independently developed without use of confidential information; or (d) is disclosed pursuant to a court order or regulatory requirement.</P>
                  <P><Strong>Aggregated Data.</Strong> CxTrack may collect and use aggregated, de-identified, and anonymized data derived from your use of the Service for analytics, benchmarking, and product improvement purposes. Such data will not identify you or your organization.</P>
                </section>

                {/* 12. Limitation of Liability */}
                <section>
                  <SectionHeader icon={AlertTriangle} title="12. Limitation of Liability" id="liability" />
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60 uppercase tracking-wider font-bold mb-3 text-[#FFD700]/60">Important — Please Read Carefully</p>
                    <p className="text-sm text-white/60">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CXTRACK&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO CXTRACK DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.</p>
                  </div>
                  <P><Strong>Exclusion of Damages.</Strong> In no event shall CxTrack be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including but not limited to: loss of profits, revenue, data, business opportunities, goodwill, or anticipated savings, regardless of the theory of liability (contract, tort, negligence, strict liability, or otherwise), even if CxTrack has been advised of the possibility of such damages.</P>
                  <P><Strong>Carve-Outs.</Strong> The limitations set forth above shall not apply to: (a) CxTrack&apos;s fraud or willful misconduct; (b) CxTrack&apos;s breach of confidentiality obligations; (c) CxTrack&apos;s indemnification obligations for intellectual property infringement; or (d) any liability that cannot be excluded or limited by applicable law.</P>
                  <P><Strong>Free Tier.</Strong> For users on the free plan, CxTrack&apos;s total liability shall not exceed $50 CAD.</P>
                </section>

                {/* 13. Indemnification */}
                <section>
                  <SectionHeader icon={Shield} title="13. Indemnification" id="indemnification" />
                  <P>You agree to defend, indemnify, and hold harmless CxTrack Inc., its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or relating to:</P>
                  <BulletList items={[
                    'Your use or misuse of the Service.',
                    'Your violation of these Terms or any applicable law or regulation.',
                    'Your breach of the Acceptable Use Policy.',
                    'Any third-party claims arising from your Customer Data, including claims from your customers or data subjects.',
                    'Your failure to obtain required consent for call recording or data processing.',
                    'Any content you upload, transmit, or make available through the Service.',
                    'Your infringement of any intellectual property or other proprietary right of any person or entity.',
                  ]} />
                </section>

                {/* 14. Warranties */}
                <section>
                  <SectionHeader icon={FileWarning} title="14. Warranties & Disclaimers" id="warranties" />
                  <P><Strong>Limited Warranty.</Strong> CxTrack warrants that it will use commercially reasonable efforts to provide the Service in a manner consistent with generally accepted industry standards and substantially in accordance with the documentation.</P>
                  <P><Strong>Disclaimer.</Strong> EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</P>
                  <P>Without limiting the foregoing, CxTrack does not warrant that:</P>
                  <BulletList items={[
                    'The Service will be uninterrupted, timely, secure, or error-free.',
                    'The results obtained from use of the Service will be accurate or reliable.',
                    'AI-generated outputs, call summaries, or automated analyses will be free from errors.',
                    'Any defects in the Service will be corrected within any specific timeframe.',
                  ]} />
                </section>

                {/* 15. Termination */}
                <section>
                  <SectionHeader icon={Trash2} title="15. Termination" id="termination" />
                  <P><Strong>Termination by You.</Strong> You may terminate your subscription at any time by cancelling through your dashboard settings. Cancellation takes effect at the end of your current billing period. No prorated refunds will be issued.</P>
                  <P><Strong>Termination by CxTrack.</Strong> CxTrack may terminate or suspend your access to the Service immediately, without prior notice, for: (a) material breach of these Terms; (b) violation of the Acceptable Use Policy; (c) non-payment of fees after a 10-day grace period; (d) fraudulent or illegal activity; or (e) upon 30 days written notice for any reason.</P>
                  <P><Strong>Effect of Termination.</Strong></P>
                  <BulletList items={[
                    'Data Export: You will have 30 days from the effective date of termination to export your Customer Data.',
                    'Data Deletion: All Customer Data will be permanently deleted 60 days after termination. CxTrack is not obligated to retain your data beyond this period.',
                    'Phone Numbers: All phone numbers associated with your account will be reclaimed immediately upon termination.',
                    'AI Tokens: Any remaining AI token allocation will be forfeited.',
                    'Survival: Sections relating to intellectual property, limitation of liability, indemnification, confidentiality, and dispute resolution shall survive termination.',
                  ]} />
                </section>

                {/* 16. SLA */}
                <section>
                  <SectionHeader icon={Zap} title="16. Service Level" id="sla" />
                  <P><Strong>Uptime Target.</Strong> CxTrack targets 99.5% uptime for the Service, measured on a monthly basis. &quot;Uptime&quot; means the Service is accessible and functioning materially as described in the documentation.</P>
                  <P><Strong>Exclusions.</Strong> The uptime target does not include:</P>
                  <BulletList items={[
                    'Scheduled maintenance (CxTrack will provide at least 48 hours notice for planned maintenance windows).',
                    'Emergency maintenance required to address security vulnerabilities or critical issues.',
                    'Downtime caused by third-party services, including but not limited to Stripe, Retell AI, Twilio, or cloud infrastructure providers.',
                    'Issues caused by your equipment, network, or software configuration.',
                    'Force majeure events as described in these Terms.',
                  ]} />
                  <P>The uptime target is a service objective, not a guarantee. CxTrack is not liable for any failure to meet the uptime target.</P>
                </section>

                {/* 17. Dispute Resolution */}
                <section>
                  <SectionHeader icon={Gavel} title="17. Dispute Resolution" id="disputes" />
                  <P><Strong>Governing Law.</Strong> These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to its conflict of law provisions.</P>
                  <P><Strong>Informal Resolution.</Strong> Before initiating any formal dispute resolution, the parties agree to first attempt to resolve any dispute informally by contacting legal@cxtrack.com. The parties shall negotiate in good faith for a period of thirty (30) days from receipt of the initial dispute notice.</P>
                  <P><Strong>Binding Arbitration.</Strong> Any dispute, claim, or controversy arising out of or relating to these Terms that is not resolved through informal negotiation shall be finally settled by binding arbitration administered in accordance with the laws of Ontario. The arbitration shall be conducted in the English language and the arbitral decision shall be final and binding on both parties.</P>
                  <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10 mb-4">
                    <p className="text-sm text-white/60"><Strong>Class Action Waiver.</Strong> YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. You waive any right to participate in a class action lawsuit or class-wide arbitration against CxTrack.</p>
                  </div>
                  <P><Strong>Legal Fees.</Strong> In any dispute, the prevailing party shall be entitled to recover its reasonable legal fees and costs from the non-prevailing party.</P>
                  <P><Strong>Injunctive Relief.</Strong> Notwithstanding the foregoing, either party may seek injunctive or equitable relief in any court of competent jurisdiction to protect its intellectual property rights or confidential information.</P>
                </section>

                {/* 18. Modifications */}
                <section>
                  <SectionHeader icon={RefreshCw} title="18. Modifications to Terms" id="modifications" />
                  <P>CxTrack reserves the right to modify these Terms at any time. For material changes, we will provide at least thirty (30) days prior written notice via email to the address associated with your account.</P>
                  <P>Your continued use of the Service after the effective date of any modification constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must discontinue use of the Service before the effective date and may terminate your subscription in accordance with Section 15.</P>
                  <P>Non-material changes (such as typographical corrections or clarifications that do not alter the substance of the Terms) may be made without prior notice.</P>
                </section>

                {/* Force Majeure (sub-section of general) */}
                <section>
                  <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06] mb-4">
                    <h3 className="font-semibold text-white mb-3">Force Majeure</h3>
                    <p className="text-white/50 text-sm">Neither party shall be liable for any failure or delay in performance due to causes beyond its reasonable control, including but not limited to: acts of God, natural disasters, epidemics or pandemics, war, terrorism, government actions, power failures, internet or telecommunications outages, cyberattacks, or failures of third-party service providers.</p>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06] mb-4">
                    <h3 className="font-semibold text-white mb-3">Entire Agreement</h3>
                    <p className="text-white/50 text-sm">These Terms, together with the Privacy Policy and any order forms or service-specific terms, constitute the entire agreement between you and CxTrack regarding the Service and supersede all prior or contemporaneous communications, proposals, and agreements, whether oral or written.</p>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
                    <h3 className="font-semibold text-white mb-3">Severability</h3>
                    <p className="text-white/50 text-sm">If any provision of these Terms is held to be unenforceable or invalid, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FFD700]/10 text-center">
                    <h3 className="text-xl font-bold text-white mb-3">Contact Us</h3>
                    <p className="text-white/40 mb-6 max-w-lg mx-auto leading-relaxed">
                      If you have questions about these Terms, please contact us.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.08] text-white/60">
                        <strong className="text-[#FFD700]/80">Legal:</strong> legal@cxtrack.com
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

export default TermsOfService;
