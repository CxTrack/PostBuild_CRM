import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, MapPin, Phone } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Sleek Header Section */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors group">
              <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mb-6">
                <Shield className="text-white" size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-base text-primary-100 mb-6 max-w-2xl mx-auto leading-relaxed">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-primary-100 text-xs font-medium">Last updated: March 17, 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
            <div className="p-8 md:p-12 space-y-12">
              
              {/* Introduction */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  1. Introduction
                </h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p className="text-lg">
                    CxTrack ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. 
                    This privacy policy explains how we collect, use, and protect your information when you use our 
                    business management platform.
                  </p>
                  <p>
                    This policy applies to all users of our services, including visitors to our website, registered users, 
                    and customers who use our AI-powered business management tools.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  2. Information We Collect
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      2.1 Information You Provide to Us
                    </h3>
                    <div className="bg-dark-700/50 rounded-lg p-6">
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Account Information:</strong> Name, email address, password, and profile details</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Business Information:</strong> Company name, address, tax identification numbers, and business details</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Customer Data:</strong> Information you input about your customers, including contact details and transaction history</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Payment Information:</strong> Billing address, payment method details (processed securely by our payment partners)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Communication Data:</strong> Messages, support requests, and feedback you send to us</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      2.2 Information We Collect Automatically
                    </h3>
                    <div className="bg-dark-700/50 rounded-lg p-6">
                      <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Usage Data:</strong> How you interact with our services, features used, and time spent</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Device Information:</strong> Browser type, operating system, device identifiers, and technical specifications</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Location Data:</strong> IP address and general geographic location</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-3 mt-1">•</span>
                          <span><strong className="text-white">Cookies and Tracking:</strong> Information collected through cookies and similar technologies</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  3. How We Use Your Information
                </h2>
                <div className="bg-dark-700/50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Service Delivery</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Provide and maintain our services</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Process your transactions</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Enable AI-powered features</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Provide customer support</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Communication & Marketing</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Send administrative information</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Send marketing communications (with consent)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Respond to inquiries and requests</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Notify you of updates and changes</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Improvement & Security</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Improve our services and user experience</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Analyze usage patterns and trends</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Protect against fraud and abuse</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Ensure platform security</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Legal Compliance</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Comply with legal obligations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Respond to legal requests</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Enforce our terms of service</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Protect our rights and interests</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Storage and Security */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  4. Data Storage and Security
                </h2>
                <div className="space-y-6">
                  <div className="bg-primary-900/20 border border-primary-800/50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Shield className="text-primary-400 mr-3" size={24} />
                      Security Measures
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      We store your data in secure facilities located in Canada and the United States. We implement 
                      appropriate technical and organizational security measures to protect your data against unauthorized 
                      access, alteration, disclosure, or destruction.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-dark-800/50 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Technical Safeguards</h4>
                        <ul className="space-y-1 text-gray-300 text-sm">
                          <li>• End-to-end encryption</li>
                          <li>• Secure data transmission (TLS 1.3)</li>
                          <li>• Regular security audits</li>
                          <li>• Access controls and monitoring</li>
                        </ul>
                      </div>
                      <div className="bg-dark-800/50 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Organizational Safeguards</h4>
                        <ul className="space-y-1 text-gray-300 text-sm">
                          <li>• Employee training programs</li>
                          <li>• Strict access policies</li>
                          <li>• Regular compliance reviews</li>
                          <li>• Incident response procedures</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  5. Data Sharing and Third Parties
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    We may share your information with trusted third parties in the following circumstances:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-dark-700/50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Service Providers</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Cloud hosting and infrastructure providers</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Payment processing partners</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Email and communication services</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Analytics and monitoring tools</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-dark-700/50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Legal Requirements</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Law enforcement agencies (when legally required)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Regulatory authorities</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Courts and legal proceedings</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-400 mr-2 mt-1">•</span>
                          <span>Protection of rights and safety</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-6">
                    <h4 className="text-yellow-400 font-semibold mb-2 flex items-center">
                      <Shield className="mr-2" size={20} />
                      Important Note
                    </h4>
                    <p className="text-gray-300">
                      We never sell, rent, or trade your personal information to third parties for their marketing purposes. 
                      All third-party partnerships are governed by strict data protection agreements.
                    </p>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  6. Your Privacy Rights
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Under applicable North American privacy laws, you have the following rights regarding your personal information:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Access & Portability</h4>
                        <p className="text-gray-300 text-sm">Request a copy of your personal information and data portability</p>
                      </div>
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Correction</h4>
                        <p className="text-gray-300 text-sm">Update or correct inaccurate personal information</p>
                      </div>
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Deletion</h4>
                        <p className="text-gray-300 text-sm">Request deletion of your personal information (subject to legal requirements)</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Opt-Out</h4>
                        <p className="text-gray-300 text-sm">Unsubscribe from marketing communications at any time</p>
                      </div>
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Consent Withdrawal</h4>
                        <p className="text-gray-300 text-sm">Withdraw consent for data processing where applicable</p>
                      </div>
                      <div className="bg-dark-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Complaint</h4>
                        <p className="text-gray-300 text-sm">File a complaint with relevant privacy authorities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  7. Data Retention
                </h2>
                <div className="bg-dark-700/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                    Specific retention periods include:
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-dark-600">
                      <span className="text-white font-medium">Account Information</span>
                      <span className="text-primary-400">Duration of account + 7 years</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dark-600">
                      <span className="text-white font-medium">Transaction Data</span>
                      <span className="text-primary-400">7 years (tax compliance)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dark-600">
                      <span className="text-white font-medium">Usage Analytics</span>
                      <span className="text-primary-400">2 years</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white font-medium">Marketing Data</span>
                      <span className="text-primary-400">Until consent withdrawn</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  8. Children's Privacy
                </h2>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed">
                    Our services are not intended for children under 13 years of age. We do not knowingly collect or 
                    maintain personal information from children under 13. If we become aware that we have collected 
                    personal information from a child under 13, we will take steps to delete such information promptly.
                  </p>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  9. International Data Transfers
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    Your information may be transferred to and processed in countries other than your country of residence. 
                    We ensure appropriate safeguards are in place for such transfers.
                  </p>
                  <div className="bg-dark-700/50 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-3">Transfer Safeguards</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <span className="text-primary-400 mr-2 mt-1">•</span>
                        <span>Standard contractual clauses approved by relevant authorities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-400 mr-2 mt-1">•</span>
                        <span>Adequacy decisions by privacy regulators</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-400 mr-2 mt-1">•</span>
                        <span>Certification schemes and codes of conduct</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  10. Changes to This Privacy Policy
                </h2>
                <div className="bg-dark-700/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We may update this privacy policy from time to time to reflect changes in our practices, technology, 
                    legal requirements, or other factors. When we make changes, we will:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2 mt-1">•</span>
                      <span>Post the updated policy on this page</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2 mt-1">•</span>
                      <span>Update the "Last updated" date at the top of this policy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2 mt-1">•</span>
                      <span>Notify you via email for material changes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2 mt-1">•</span>
                      <span>Provide notice through our platform</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-dark-700 pb-4">
                  11. Contact Us
                </h2>
                <div className="bg-primary-900/20 border border-primary-800/50 rounded-lg p-8">
                  <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                    If you have questions about this privacy policy, want to exercise your privacy rights, or need to 
                    contact our Data Protection Officer, please reach out to us:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Mail className="text-primary-400 mt-1" size={20} />
                        <div>
                          <h4 className="text-white font-semibold">Email</h4>
                          <p className="text-gray-300">privacy@cxtrack.com</p>
                          <p className="text-gray-400 text-sm">For privacy-related inquiries</p>
                        </div>
                      </div>
                      
                      {/* <div className="flex items-start space-x-3">
                        <Phone className="text-primary-400 mt-1" size={20} />
                        <div>
                          <h4 className="text-white font-semibold">Phone</h4>
                          <p className="text-gray-300">+1 (431) 816-4727</p>
                          <p className="text-gray-400 text-sm">Business hours: 9 AM - 5 PM EST</p>
                        </div>
                      </div> */}
                    </div>
                    
                    <div>
                      <div className="flex items-start space-x-3">
                        <Phone className="text-primary-400 mt-1" size={20} />
                        <div>
                          <h4 className="text-white font-semibold">Phone</h4>
                          <p className="text-gray-300">+1 (431) 816-4727</p>
                          <p className="text-gray-400 text-sm">Business hours: 9 AM - 5 PM EST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-primary-800/50">
                    <p className="text-gray-400 text-sm">
                      <strong className="text-white">Response Time:</strong> We aim to respond to all privacy-related 
                      inquiries within 30 days. For urgent matters, please call our support line.
                    </p>
                  </div>
                </div>
              </section>

              {/* Effective Date */}
              <section className="border-t border-dark-700 pt-8">
                <div className="text-center">
                  <p className="text-gray-400">
                    This Privacy Policy is effective as of <strong className="text-white">March 17, 2025</strong> and 
                    supersedes all previous versions.
                  </p>
                  <div className="mt-6">
                    <Link 
                      to="/contact" 
                      className="btn btn-primary inline-flex items-center space-x-2"
                    >
                      <Mail size={16} />
                      <span>Contact Us About Privacy</span>
                    </Link>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;