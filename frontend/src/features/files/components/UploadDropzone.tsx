import { useRef, ChangeEvent, useState, DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';

interface UploadDropzoneProps {
  onUploadSuccess: () => void;
  onError: (errorMsg: string) => void;
}

export const UploadDropzone = ({ onUploadSuccess, onError }: UploadDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { handleUpload, isPending } = useFileUpload(onUploadSuccess, onError);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    await handleUpload(selectedFile, resetInput);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isPending) return;

    const droppedFile = e.dataTransfer.files?.[0];
    await handleUpload(droppedFile, resetInput);
  };

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-center w-full">
        <label 
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors 
            ${isPending ? 'border-blue-300 bg-blue-50' : ''} 
            ${isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-10 h-10 mb-3 ${isPending || isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">
                {isPending ? 'Enviando...' : isDragging ? 'Solte para enviar' : 'Click or drag to upload'}
              </span> (Máx 10MB)
            </p>
            <p className="text-xs text-gray-500">.PNG, .JPG, .PDF, .TXT</p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={onFileChange}
            disabled={isPending}
            accept=".png,.jpg,.jpeg,.pdf,.txt"
          />
        </label>
      </div>
    </div>
  );
};
