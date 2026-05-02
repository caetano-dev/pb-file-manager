'use client';

import { useRef, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';

interface UploadDropzoneProps {
  onUploadSuccess: () => void;
  onError: (errorMsg: string) => void;
}

export const UploadDropzone = ({ onUploadSuccess, onError }: UploadDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { handleUpload, isPending } = useFileUpload(onUploadSuccess, onError);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    await handleUpload(selectedFile, resetInput);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isPending ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-10 h-10 mb-3 ${isPending ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">{isPending ? 'Uploading...' : 'Click to upload'}</span> (Max 10MB)
            </p>
            <p className="text-xs text-gray-500">.PNG, .JPG, .PDF, .TXT</p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={onChange}
            disabled={isPending}
            accept=".png,.jpg,.jpeg,.pdf,.txt"
          />
        </label>
      </div>
    </div>
  );
};
