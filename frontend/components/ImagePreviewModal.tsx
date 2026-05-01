'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  url: string | null;
  name: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ url, name, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium truncate pr-4">{name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex justify-center bg-gray-100">
          <img 
            src={url} 
            alt={name} 
            className="max-h-[70vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};