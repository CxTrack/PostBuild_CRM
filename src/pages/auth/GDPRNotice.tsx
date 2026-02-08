import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const GDPRNotice: React.FC = () => {
  const navigate = useNavigate();
  const [isEUUser, setIsEUUser] = useState(false);

  useEffect(() => {
    // Check user's location using ipapi.co
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const euCountries = [
          'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
          'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
          'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
        ];
        
        if (euCountries.includes(data.country_code)) {
          setIsEUUser(true);
          // Redirect EU users back to home after 5 seconds
          setTimeout(() => {
            navigate('/');
          }, 5000);
        }
      })
      .catch(err => {
        console.error('Error checking location:', err);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-white mb-8 hover:text-primary-200">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Regional Availability Notice
            </h1>
            <p className="text-xl text-primary-200">
              Important information about CxTrack's regional availability and data handling.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {isEUUser ? (
          <div className="bg-red-900/50 border border-red-800 rounded-lg p-8 mb-8">
            <div className="flex items-start">
              <AlertTriangle size={24} className="text-red-400 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Service Not Available in Your Region
                </h2>
                <p className="text-red-200">
                  We've detected that you're accessing CxTrack from a European Union member state. 
                  Unfortunately, our services are not available in your region. You will be redirected 
                  to the homepage in a few seconds.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              North American Service Only
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Regional Availability
                </h3>
                <p className="text-gray-300">
                  CxTrack's services are exclusively available to users in North America (United States and Canada). 
                  We do not operate in or provide services to users in the European Union or other regions 
                  governed by GDPR regulations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Data Handling Notice
                </h3>
                <p className="text-gray-300">
                  Our platform is designed for North American business operations and complies with 
                  applicable North American data protection laws. We do not claim GDPR compliance and 
                  do not offer GDPR-mandated data subject rights or protections.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Access Restrictions
                </h3>
                <p className="text-gray-300">
                  Users attempting to access our services from European Union member states will be 
                  automatically blocked. This includes registration, login, and use of our platform's features.
                </p>
              </div>

              <div className="bg-dark-700 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  By using CxTrack, you acknowledge that:
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    You are located in and accessing our services from North America
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    Your use of our services is not subject to GDPR regulations
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    Data handling and privacy practices follow North American standards
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    You will not attempt to circumvent regional access restrictions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GDPRNotice;