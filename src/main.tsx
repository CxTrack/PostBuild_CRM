import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import StripeProvider from './components/StripeProvider.tsx';
import { toast } from 'react-hot-toast';

// Log environment information
console.log('Environment:', import.meta.env.MODE);

// Validate environment variables on startup
try {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY'
  ];

  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate OpenAI key format
  if (!import.meta.env.VITE_OPENAI_API_KEY.startsWith('sk-')) {
    console.error('Warning: OpenAI API key format may be invalid. Expected key to start with "sk-"');
  }
} catch (error) {
  console.error('Environment validation error:', error);
  toast.error('Application configuration error. Please check the console.');
}

// Remove demo mode notification for production
const isDemoMode = false;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StripeProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
            },
            duration: 4000,
          }}
        />
        {isDemoMode && (
          <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-md shadow-lg">
            Demo Mode
          </div>
        )}
      </StripeProvider>
    </BrowserRouter>
  </StrictMode>
);