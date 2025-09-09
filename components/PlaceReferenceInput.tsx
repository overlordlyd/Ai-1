import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types';

interface PlaceReferenceInputProps {
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

export const PlaceReferenceInput: React.FC<PlaceReferenceInputProps> = ({ onFileSelect }) => {
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
        Place Reference (Optional)
      </label>
      <div className="mt-1 flex justify-center px-4 py-3 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {preview ? (
            <img src={preview} alt="Place Preview" className="mx-auto h-20 w-auto object-contain rounded-md" />
          ) : (
             <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <div className="flex text-sm text-gray-500">
            <label htmlFor="place-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
              <span>Upload place</span>
              <input id="place-file-upload" name="place-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-600 truncate max-w-[150px]">{fileName}</p>
        </div>
      </div>
    </div>
  );
};