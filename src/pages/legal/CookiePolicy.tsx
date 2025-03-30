import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

const CookiePolicy: React.FC = () => {
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
              <Cookie className="text-primary-400 mr-3" size={32} />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Cookie Policy</h1>
            </div>
            <p className="text-xl text-primary-200">Last updated: March 17, 2025</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide useful information to website owners.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          
          <h3>2.1 Essential Cookies</h3>
          <ul>
            <li>Authentication and security</li>
            <li>Session management</li>
            <li>Load balancing</li>
            <li>Remember your preferences</li>
          </ul>

          <h3>2.2 Performance Cookies</h3>
          <ul>
            <li>Analyze how you use our website</li>
            <li>Improve website performance</li>
            <li>Monitor error rates</li>
            <li>Test new features</li>
          </ul>

          <h3>2.3 Functionality Cookies</h3>
          <ul>
            <li>Remember your preferences</li>
            <li>Customize your experience</li>
            <li>Save your settings</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          <h3>3.1 Session Cookies</h3>
          <p>
            These temporary cookies are erased when you close your browser. We use session cookies to maintain your session while using our services.
          </p>

          <h3>3.2 Persistent Cookies</h3>
          <p>
            These cookies remain on your device until they expire or you delete them. We use persistent cookies to remember your preferences and settings.
          </p>

          <h3>3.3 Third-Party Cookies</h3>
          <p>
            We use services from these third parties that may place cookies:
          </p>
          <ul>
            <li>Google Analytics (analytics)</li>
            <li>Stripe (payment processing)</li>
            <li>Intercom (customer support)</li>
          </ul>

          <h2>4. Cookie Management</h2>
          <h3>4.1 Browser Settings</h3>
          <p>
            You can control and manage cookies through your browser settings. Please note that removing or blocking cookies may impact your user experience and some features may not function as intended.
          </p>

          <h3>4.2 Third-Party Tools</h3>
          <p>
            You can also manage cookies through these third-party tools:
          </p>
          <ul>
            <li>Google Analytics Opt-out Browser Add-on</li>
            <li>Your Online Choices (for behavioral advertising)</li>
            <li>Network Advertising Initiative</li>
          </ul>

          <h2>5. Required Cookies</h2>
          <p>
            Some cookies are strictly necessary for our website to function properly. You can set your browser to block these cookies, but some parts of the site may not work properly.
          </p>

          <h2>6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have questions about our Cookie Policy, please contact us at:
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

export default CookiePolicy;