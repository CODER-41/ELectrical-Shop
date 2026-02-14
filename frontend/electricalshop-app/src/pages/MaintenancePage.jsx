import React from 'react';
import { Wrench, Clock, Mail } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/elogo.png" 
            alt="Quantum Gear Electronics Logo" 
            className="w-24 h-24 mx-auto rounded-full shadow-lg"
          />
        </div>
        
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6">
            <Wrench className="w-12 h-12 text-yellow-600" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 text-blue-700 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Expected Duration</span>
          </div>
          <p className="text-gray-700">
            We'll be back shortly. Thank you for your patience!
          </p>
        </div>

        <div className="space-y-4 text-left bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 text-center mb-4">
            What's happening?
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>System upgrades and improvements</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>Database optimization</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>Security enhancements</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Need urgent assistance?</p>
          <a
            href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'support@electronicsshop.com'}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Quantum Gear Electronics</p>
          <p className="mt-1">We appreciate your understanding</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
