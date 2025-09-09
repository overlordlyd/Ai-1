import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types';

interface CharacterReferenceInputProps {
  onFileSelect: (files: UploadedFile[]) => void;
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

export const CharacterReferenceInput: React.FC<CharacterReferenceInputProps> = ({ onFileSelect }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const allFiles = [...uploadedFiles.map(uf => uf.file), ...newFiles];
      
      const newUploadedFiles: UploadedFile[] = [];
      const newPreviews: string[] = [];

      for (const file of allFiles) {
        newPreviews.push(URL.createObjectURL(file));
        try {
          const { base64, mimeType } = await fileToBase64(file);
          newUploadedFiles.push({ file, base64, mimeType });
        } catch (error) {
          console.error("Error converting file to base64", error);
        }
      }

      setUploadedFiles(newUploadedFiles);
      setPreviews(newPreviews);
      onFileSelect(newUploadedFiles);
    }
    // Clear the input value to allow re-selecting the same file
    event.target.value = '';
  }, [onFileSelect, uploadedFiles]);

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(previews[indexToRemove]); // Clean up memory
    const newUploaded = uploadedFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);

    setUploadedFiles(newUploaded);
    setPreviews(newPreviews);
    onFileSelect(newUploaded);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-purple-400 mb-2">
        Source Character
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {previews.length === 0 ? (
            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M20 16h.01M24 20h.01M28 24h.01M12 28h.01M16 24h.01M20 20h.01M24 16h.01M28 12h.01M12 20h.01M16 16h.01M12 12h.01M16 12h.01M20 12h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
                {previews.map((src, index) => (
                    <div key={index} className="relative group">
                        <img src={src} alt={`Preview ${index + 1}`} className="h-16 w-16 object-cover rounded-md" />
                        <button 
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                        >
                          X
                        </button>
                    </div>
                ))}
            </div>
          )}
          <div className="flex text-sm text-gray-500">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
              <span>{uploadedFiles.length > 0 ? 'Add more...' : 'Upload file(s)'}</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
            </label>
            {uploadedFiles.length === 0 && <p className="pl-1">or drag and drop</p>}
          </div>
          <p className="text-xs text-gray-600">{uploadedFiles.length} image(s) selected</p>
        </div>
      </div>
    </div>
  );
};