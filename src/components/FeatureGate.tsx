import React from 'react';
import { Star, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: string;
  plan: string;
  isAccessible: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ 
  children, 
  feature, 
  plan, 
  isAccessible
}) => {
  if (isAccessible) {
    return children;
  }

  return (
    <div 
      className="group relative cursor-pointer" 
      onClick={() => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-dark-800 rounded-lg p-8 max-w-md m-4 relative transform scale-100 transition-all duration-200">
            <div class="text-center">
              <div class="bg-gradient-to-r from-primary-600 to-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">Premium Feature</h3>
              <p class="text-gray-300 text-lg mb-2">${feature} is available on ${plan}</p>
              <p class="text-gray-400 mb-6">Upgrade to access AI-powered automation and advanced features</p>
              <a href="/settings?tab=billing" class="btn btn-primary bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 px-8 py-3 text-lg font-medium inline-block">
                Upgrade Now
              </a>
            </div>
            <button class="absolute top-4 right-4 text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on click outside or close button
        modal.addEventListener('click', (e) => {
          if (e.target === modal || e.target.closest('button')) {
            modal.remove();
          }
        });
      }}
    >
      <div className="relative">
        {children}
        <div className="absolute -top-2 -right-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        </div>
      </div>
    </div>
  );
};

export default FeatureGate;