import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="text-primary-400 mr-3" size={32} />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Privacy Policy</h1>
            </div>
            <p className="text-xl text-primary-200">Last updated: March 17, 2025</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h2>1. Introduction</h2>
          <p>
            CxTrack ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our business management platform.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Account information (name, email, password)</li>
            <li>Business information (company name, address, tax numbers)</li>
            <li>Customer data you input into our system</li>
            <li>Payment information</li>
            <li>Communication preferences</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li>Usage data and analytics</li>
            <li>Device and browser information</li>
            <li>IP address and location data</li>
            <li>Cookies and similar technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain our services</li>
            <li>To process your transactions</li>
            <li>To send administrative information</li>
            <li>To provide customer support</li>
            <li>To send marketing communications (with consent)</li>
            <li>To improve our services</li>
            <li>To protect against fraud</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p>
            We store your data in Canada and the United States. We implement appropriate technical and organizational security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>5. Data Sharing and Third Parties</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li>Service providers and business partners</li>
            <li>Payment processors</li>
            <li>Analytics providers</li>
            <li>Law enforcement when required by law</li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>
            Under applicable North American privacy laws, you have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent where applicable</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and comply with legal obligations. When data is no longer needed, it is securely deleted.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13. We do not knowingly collect or maintain information from children under 13.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our practices, please contact us at:
          </p>
          <p>
            Email: privacy@cxtrack.com<br />
            Address: 123 Business Street, Toronto, ON M5V 2T6, Canada
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;