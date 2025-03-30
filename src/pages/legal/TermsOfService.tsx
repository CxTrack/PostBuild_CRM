import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-white mb-8 hover:text-primary-200">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <FileText className="text-primary-400 mr-3" size={32} />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Terms of Service</h1>
            </div>
            <p className="text-xl text-primary-200">Last updated: March 17, 2025</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using CxTrack's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
          </p>

          <h2>2. Use License</h2>
          <p>
            We grant you a limited, non-exclusive, non-transferable, revocable license to use our services for your business purposes in accordance with these Terms.
          </p>

          <h3>2.1 Restrictions</h3>
          <p>You may not:</p>
          <ul>
            <li>Modify or copy our software</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Transfer your account to another party</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
          </ul>

          <h2>3. Account Terms</h2>
          <ul>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>You must notify us of any security breach</li>
            <li>We reserve the right to terminate accounts</li>
          </ul>

          <h2>4. Payment Terms</h2>
          <ul>
            <li>Subscription fees are billed in advance</li>
            <li>All fees are non-refundable</li>
            <li>30-day notice required for cancellation</li>
            <li>Taxes are your responsibility</li>
          </ul>

          <h2>5. Service Availability and Updates</h2>
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may modify, suspend, or discontinue any part of our service with or without notice.
          </p>

          <h2>6. Data Ownership and Privacy</h2>
          <p>
            You retain all rights to your data. Our privacy practices are governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            All content, features, and functionality are owned by CxTrack and are protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            CxTrack shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless CxTrack and its employees from any claims resulting from your use of our services.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of Canada without regard to its conflict of law provisions.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms on this page.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            For any questions about these Terms, please contact us at:<br />
            Email: legal@cxtrack.com<br />
            Address: 123 Business Street, Toronto, ON M5V 2T6, Canada
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;