import React from 'react';
import { Trash2, Download, File as FileIcon, Eye, Share2 } from 'lucide-react';
import type { FileData } from '../types';

interface FileTableProps {
  files: FileData[];
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FileTable: React.FC<FileTableProps> = ({ files, onDownload, onPreview, onShare, onDelete }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Size</th>
            <th className="p-4 font-medium">Uploaded</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500">
                No files uploaded yet.
              </td>
            </tr>
          ) : (
            files.map((file) => (
              <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <FileIcon className="text-gray-400 w-5 h-5" />
                  <span className="font-medium text-gray-800">{file.original_name}</span>
                </td>
                <td className="p-4 text-gray-600">{formatBytes(file.size)}</td>
                <td className="p-4 text-gray-600">
                  {new Date(file.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  {isImage(file.mime_type) && (
                    <button 
                      onClick={() => onPreview(file.id, file.original_name)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded mr-2 transition-colors inline-flex items-center"
                      title="Preview Image"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => onShare(file.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded mr-2 transition-colors inline-flex items-center"
                    title="Copy Shareable Link"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDownload(file.id, file.original_name)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2 transition-colors inline-flex items-center"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};