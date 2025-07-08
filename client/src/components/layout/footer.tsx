import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo Slogan */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
              <img 
                src="/assets/logo-slogan.png" 
                alt="Duka Fiti ni Duka Bora" 
                className="h-4 w-auto max-w-[150px] drop-shadow-sm"
              />
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} DukaFiti. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Smart POS for Kenyan Dukawalas
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}