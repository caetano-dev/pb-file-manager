import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  filename: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
  isOpen,
  imageUrl, 
  filename, 
  onClose 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 truncate pr-4">{filename}</h3>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex justify-center items-center bg-gray-50/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={filename} 
            className="max-w-full max-h-[70vh] object-contain rounded-md shadow-sm" 
          />
        </div>
      </div>
    </div>
  );
};
