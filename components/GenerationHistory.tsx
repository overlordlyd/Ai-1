import React from 'react';
import { GenerationResult } from '../types';

interface GenerationHistoryProps {
  history: GenerationResult[];
  setHistory: React.Dispatch<React.SetStateAction<GenerationResult[]>>;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({ history, setHistory }) => {
  if (history.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-40 bg-gray-900/80 backdrop-blur-sm border-t border-purple-500/30 p-4 shadow-2xl shadow-black z-10">
      <div className='flex justify-between items-center mb-2'>
        <h3 className="text-lg font-bold text-purple-400">Conquered Visions</h3>
        <button 
          onClick={() => setHistory([])}
          className="text-xs bg-red-800/50 hover:bg-red-700/70 text-gray-300 px-3 py-1 rounded-md transition-colors"
        >
          Banish All
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 h-full">
        {history.map((item) => (
          <div key={item.id} className="group relative flex-shrink-0 w-24 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all">
            {/* If it's a successful video, show a video. Otherwise (successful image or ANY censored item), show an image. */}
            {item.type === 'video' && item.status === 'success' && item.url ? (
              <video src={item.url} muted autoPlay loop className="w-full h-full object-cover">
                Your browser does not support the video tag.
              </video>
            ) : (
              item.url && <img src={item.url} alt={item.text || 'Generated result'} className="w-full h-full object-cover" />
            )}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="truncate">{item.text || 'Untitled Vision'}</p>
            </div>
          </div>
        ))}
         {/* Custom scrollbar styling for this component */}
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            height: 6px;
          }
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #1a1a2e;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #7e22ce;
            border-radius: 3px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: #9333ea;
          }
        `}</style>
      </div>
    </div>
  );
};
