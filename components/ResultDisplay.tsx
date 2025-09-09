
import React from 'react';

interface ResultDisplayProps {
  image: string | null;
  videoUrl: string | null;
  text: string | null;
  error: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ image, videoUrl, text, error }) => {
  if (error) {
    return (
      <div className="text-center text-red-400 p-4">
        <h3 className="font-bold text-lg">A Catastrophe!</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!image && !videoUrl) {
    return (
      <div className="text-center text-gray-500">
        <p>Your creation will appear here.</p>
        <p className="text-sm">The void awaits your command.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      {image && (
        <img src={image} alt="Generated result" className="max-w-full max-h-80 object-contain rounded-lg shadow-lg shadow-black" />
      )}
      {videoUrl && (
        <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-80 object-contain rounded-lg shadow-lg shadow-black">
          Your browser does not support the video tag.
        </video>
      )}
      {text && (
        <div className="w-full text-sm text-gray-300 bg-gray-800 p-3 rounded-md border border-gray-700">
          <p className="font-bold text-purple-400">A message from the beyond:</p>
          <p className="italic">"{text}"</p>
        </div>
      )}
    </div>
  );
};
