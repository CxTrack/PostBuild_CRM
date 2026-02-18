import React from 'react';
import { Shield, Lock, Eye, Cookie, Database, Globe, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-black py-12 px-4 scroll-smooth">
            <div className="max-w-4xl mx-auto">

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
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-white/40">
                        Last updated: January 5, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">

                    <div className="p-8 space-y-12">

                        {/* Introduction */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Info className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Introduction
                                </h2>
                            </div>
                            <p className="text-white/60 leading-relaxed">
                                At CxTrack, we take your privacy seriously. This Privacy Policy explains how we collect,
                                use, disclose, and safeguard your information when you use our CRM platform. We are committed
                                to protecting your personal data and your right to privacy.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Database className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Information We Collect
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full"></span>
                                        Personal Information
                                    </h3>
                                    <ul className="space-y-2 text-white/60 text-sm ml-4 list-disc">
                                        <li>Name, email address, and contact information</li>
                                        <li>Company name and business information</li>
                                        <li>Billing and payment information</li>
                                        <li>Profile information and preferences</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full"></span>
                                        Usage Data
                                    </h3>
                                    <ul className="space-y-2 text-white/60 text-sm ml-4 list-disc">
                                        <li>Log data (IP address, browser type, access times)</li>
                                        <li>Device information and identifiers</li>
                                        <li>Usage patterns and feature interactions</li>
                                        <li>Performance and analytics data</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Eye className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    How We Use Your Information
                                </h2>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
                                <ul className="grid md:grid-cols-2 gap-4 text-white/60 text-sm">
                                    {[
                                        "To provide and maintain services",
                                        "To process transactions and billing",
                                        "To send updates and support messages",
                                        "To analyze usage and improve our platform",
                                        "To protect against fraud",
                                        "To comply with legal obligations"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-[#FFD700] shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Cookies and Tracking */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Cookie className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Cookies
                                </h2>
                            </div>
                            <p className="text-white/60 mb-6 leading-relaxed">
                                We use cookies and similar tracking technologies to track activity on our service
                                and store certain information. You can manage your cookie preferences through our
                                cookie consent banner.
                            </p>
                            <div className="bg-[#FFD700]/[0.04] rounded-xl p-5 border border-[#FFD700]/10">
                                <p className="text-sm text-white/60">
                                    <strong className="text-[#FFD700]/80">Types of cookies we use:</strong> Necessary cookies (essential functionality),
                                    Analytics cookies (usage tracking), Marketing cookies (advertising and personalization)
                                </p>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Lock className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Data Security
                                </h2>
                            </div>
                            <p className="text-white/60 leading-relaxed mb-6">
                                We implement industry-standard security measures to protect your data, including:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    "End-to-end encryption",
                                    "Regular security audits",
                                    "Strict access controls",
                                    "Secure infrastructure",
                                    "Automated backups",
                                    "DDoS protection"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg text-sm text-white/60 border border-white/[0.06]">
                                        <Shield className="w-4 h-4 text-[#FFD700]/60" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                                    <Globe className="w-5 h-5 text-[#FFD700]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Your Privacy Rights
                                </h2>
                            </div>
                            <p className="text-white/60 mb-6 font-medium">
                                Depending on your location, you may have the following rights:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    "Access to your data",
                                    "Correction of inaccurate data",
                                    "Deletion of your data",
                                    "Restriction of processing",
                                    "Data portability",
                                    "Withdrawal of consent"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 border border-white/[0.06] rounded-lg text-sm text-white/60">
                                        <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FFD700]/10 text-center">
                                <h3 className="text-xl font-bold text-white mb-3">
                                    Questions or Concerns?
                                </h3>
                                <p className="text-white/40 mb-6 max-w-lg mx-auto leading-relaxed">
                                    If you have any questions about this Privacy Policy or our data practices,
                                    please don't hesitate to reach out to our team.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.08] text-white/60">
                                        <strong className="text-[#FFD700]/80">Email:</strong> privacy@cxtrack.com
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.08] text-white/60">
                                        <strong className="text-[#FFD700]/80">Support:</strong> support@cxtrack.com
                                    </div>
                                </div>
                            </div>
                        </section>

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

const CheckCircle = ({ size = 24, className }: { size?: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
