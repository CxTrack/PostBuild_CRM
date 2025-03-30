import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CircleUser } from 'lucide-react';

const FeatureLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-primary-900 py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-4">
            <img src="/logo.svg" alt="CxTrack Logo" className="h-10 w-10 logo-glow" />
            <h1 className="brand-logo text-2xl font-bold text-white brand-text">CxTrack</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md">
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-6 py-4">
        <Outlet />
      </main>
    </div>
  );
};

export default FeatureLayout;