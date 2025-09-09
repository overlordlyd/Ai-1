
import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types';

interface ImageInputProps {
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

export const ImageInput: React.FC<ImageInputProps> = ({ onFileSelect }) => {
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
        Source Material
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {preview ? (
            <img src={preview} alt="Preview" className="mx-auto h-32 w-auto object-contain rounded-md" />
          ) : (
            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M20 16h.01M24 20h.01M28 24h.01M12 28h.01M16 24h.01M20 20h.01M24 16h.01M28 12h.01M12 20h.01M16 16h.01M12 12h.01M16 12h.01M20 12h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div className="flex text-sm text-gray-500">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-600">{fileName}</p>
        </div>
      </div>
    </div>
  );
};
