import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types';

interface PoseReferenceInputProps {
  onFileSelect: (file: UploadedFile | null) => void;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const PoseReferenceInput: React.FC<PoseReferenceInputProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('No file chosen');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      try {
        const { base64, mimeType } = await fileToBase64(file);
        onFileSelect({ file, base64, mimeType });
      } catch (error) {
        console.error("Error converting file to base64", error);
        onFileSelect(null);
      }
    } else {
      setPreview(null);
      setFileName('No file chosen');
      onFileSelect(null);
    }
  }, [onFileSelect]);

  return (
    <div>
      <label className="block text-sm font-medium text-purple-400 mb-2">
        Pose Reference (Optional)
      </label>
      <div className="mt-1 flex justify-center px-4 py-3 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {preview ? (
            <img src={preview} alt="Pose Preview" className="mx-auto h-20 w-auto object-contain rounded-md" />
          ) : (
             <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3" />
            </svg>
          )}
          <div className="flex text-sm text-gray-500">
            <label htmlFor="pose-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
              <span>Upload pose</span>
              <input id="pose-file-upload" name="pose-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-600 truncate max-w-[150px]">{fileName}</p>
        </div>
      </div>
    </div>
  );
};