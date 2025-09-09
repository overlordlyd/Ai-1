
import React from 'react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const getButtonClasses = (mode: AppMode) => {
    const baseClasses = "w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
    if (mode === currentMode) {
      return `${baseClasses} bg-purple-600 text-white shadow-lg shadow-purple-500/40`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-purple-500`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onModeChange(AppMode.ImageToImage)}
        className={getButtonClasses(AppMode.ImageToImage)}
      >
        Malignant Makeover (I2I)
      </button>
      <button
        onClick={() => onModeChange(AppMode.ImageToVideo)}
        className={getButtonClasses(AppMode.ImageToVideo)}
      >
        Sinister Animation (I2V)
      </button>
    </div>
  );
};
