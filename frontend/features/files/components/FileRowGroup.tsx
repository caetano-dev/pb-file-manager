import { useState } from 'react';
import { Trash2, Download, File as FileIcon, Eye, Share2, ChevronDown, ChevronRight } from 'lucide-react';
import type { FileData } from '../types';
import { formatBytes, isImage } from '../utils';

interface FileRowGroupProps {
  filename: string;
  fileVersions: FileData[];
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FileRowGroup = ({
  filename,
  fileVersions,
  onDownload,
  onPreview,
  onShare,
  onDelete,
}) : FileRowGroupProps => {
  const [isExpanded, setIsExpanded] = useState(false);

  const latestFile = fileVersions[0];
  const hasHistory = fileVersions.length > 1;
  return (
      <>
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td className="p-4">
            <div className="flex items-center gap-3">
              {hasHistory ? (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                >
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              ) : (
                <div className="w-5 h-5" />
              )}
              <FileIcon className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-gray-800 truncate">{latestFile.original_name}</span>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                v{latestFile.version}
              </span>
            </div>
          </td>
          <td className="p-4 text-left text-gray-600 whitespace-nowrap">{formatBytes(latestFile.size)}</td>
          <td className="p-4 text-left text-gray-600 whitespace-nowrap">{new Date(latestFile.created_at).toLocaleDateString()}</td>
          <td className="p-4">
            <div className="flex justify-end">
              <div className="flex items-center justify-end w-44">
                {isImage(latestFile.mime_type) && (
                  <button onClick={() => onPreview(latestFile.id, latestFile.original_name)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded mr-2 transition-colors inline-flex items-center">
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => onShare(latestFile.id)} className="p-2 text-green-600 hover:bg-green-50 rounded mr-2 transition-colors inline-flex items-center">
                  <Share2 className="w-5 h-5" />
                </button>
                <button onClick={() => onDownload(latestFile.id, latestFile.original_name)} className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2 transition-colors inline-flex items-center">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(latestFile.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </td>
        </tr>
  
        {isExpanded && fileVersions.slice(1).map(oldFile => (
          <tr key={oldFile.id} className="bg-gray-50 border-b border-gray-100 text-sm">
            <td className="p-4 pl-16">
              <div className="flex items-center gap-3 text-gray-500">
                <span className="text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  v{oldFile.version}
                </span>
                <span className="truncate">{oldFile.original_name}</span>
              </div>
            </td>
            <td className="p-4 text-left text-gray-500 whitespace-nowrap">{formatBytes(oldFile.size)}</td>
            <td className="p-4 text-left text-gray-500 whitespace-nowrap">{new Date(oldFile.created_at).toLocaleDateString()}</td>
            <td className="p-4">
              <div className="flex justify-end opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-end w-44">
                  <button onClick={() => onDownload(oldFile.id, oldFile.original_name)} className="p-2 text-blue-600 hover:bg-blue-100 rounded mr-2 transition-colors inline-flex items-center">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(oldFile.id)} className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors inline-flex items-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </>
    );
};