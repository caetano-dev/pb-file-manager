import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import api from '../api/axios';

interface UploadDropzoneProps {
  onUploadSuccess: () => void;
  onError: (errorMsg: string) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Client-side validation
    if (selectedFile.size > 10 * 1024 * 1024) {
      onError('File size exceeds the 10MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onError('');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      onError(err.response?.data?.detail || 'Upload failed. Check file size and type.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-10 h-10 mb-3 ${isUploading ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">{isUploading ? 'Uploading...' : 'Click to upload'}</span> (Max 10MB)
            </p>
            <p className="text-xs text-gray-500">.PNG, .JPG, .PDF, .TXT</p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleUpload}
            disabled={isUploading}
            accept=".png,.jpg,.jpeg,.pdf,.txt"
          />
        </label>
      </div>
    </div>
  );
};