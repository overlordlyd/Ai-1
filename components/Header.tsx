
import React from 'react';

// A simple SVG Skull Icon for thematic flair
const SkullIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 8a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-3 4a3 3 0 100-6 3 3 0 000 6zM5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    <path d="M10 12a1 1 0 01-1-1V9a1 1 0 112 0v2a1 1 0 01-1 1z" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex justify-center items-center gap-4">
        <SkullIcon />
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500">
          Villain's Vision AI
        </h1>
        <SkullIcon />
      </div>
      <p className="mt-2 text-lg text-gray-400">The ultimate tool for your diabolical creations.</p>
    </header>
  );
};
