import { useState, ReactNode } from 'react';
import { Trash2, Download, File as FileIcon, Eye, Share2, ChevronDown, ChevronRight } from 'lucide-react';
import type { FileData } from '../types';
import { formatBytes, isImage } from '../utils';
import { ActionButton } from '@/components/ui/ActionButton';

interface FileRowGroupProps {
  filename: string;
  fileVersions: FileData[];
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FileRowGroup = ({
  fileVersions,
  onDownload,
  onPreview,
  onShare,
  onDelete,
}: FileRowGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const latestFile = fileVersions[0];
  const hasHistory = fileVersions.length > 1;

  return (
    <>
      <PrimaryRow
        file={latestFile}
        hasHistory={hasHistory}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onDownload={onDownload}
        onPreview={onPreview}
        onShare={onShare}
        onDelete={onDelete}
      />

      {isExpanded && fileVersions.slice(1).map(oldFile => (
        <HistoryRow
          key={oldFile.id}
          file={oldFile}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

interface PrimaryRowProps {
  file: FileData;
  hasHistory: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

const PrimaryRow = ({
  file,
  hasHistory,
  isExpanded,
  onToggleExpand,
  onDownload,
  onPreview,
  onShare,
  onDelete,
}: PrimaryRowProps) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="p-4">
      <div className="flex items-center gap-3">
        {hasHistory ? (
          <button 
            onClick={onToggleExpand} 
            className="text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-5 h-5" />
        )}
        <FileIcon className="text-gray-400 w-5 h-5 flex-shrink-0" />
        <span className="font-medium text-gray-800 truncate">{file.original_name}</span>
        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
          v{file.version}
        </span>
      </div>
    </td>
    <td className="p-4 text-left text-gray-600 whitespace-nowrap">{formatBytes(file.size)}</td>
    <td className="p-4 text-left text-gray-600 whitespace-nowrap">{new Date(file.created_at).toLocaleDateString()}</td>
    <td className="p-4">
      <div className="flex justify-end">
        <div className="flex items-center justify-end w-44">
          {isImage(file.mime_type) && (
            <ActionButton 
              onClick={() => onPreview(file.id, file.original_name)} 
              className="text-indigo-600 hover:bg-indigo-50 mr-2"
            >
              <Eye className="w-5 h-5" />
            </ActionButton>
          )}
          <ActionButton 
            onClick={() => onShare(file.id)} 
            className="text-green-600 hover:bg-green-50 mr-2"
          >
            <Share2 className="w-5 h-5" />
          </ActionButton>
          <ActionButton 
            onClick={() => onDownload(file.id, file.original_name)} 
            className="text-blue-600 hover:bg-blue-50 mr-2"
          >
            <Download className="w-5 h-5" />
          </ActionButton>
          <ActionButton 
            onClick={() => onDelete(file.id)} 
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-5 h-5" />
          </ActionButton>
        </div>
      </div>
    </td>
  </tr>
);

interface HistoryRowProps {
  file: FileData;
  onDownload: (id: number, filename: string) => void;
  onDelete: (id: number) => void;
}

const HistoryRow = ({ file, onDownload, onDelete }: HistoryRowProps) => (
  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
    <td className="p-4 pl-16">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
          v{file.version}
        </span>
        <span className="truncate">{file.original_name}</span>
      </div>
    </td>
    <td className="p-4 text-left text-gray-500 whitespace-nowrap">{formatBytes(file.size)}</td>
    <td className="p-4 text-left text-gray-500 whitespace-nowrap">{new Date(file.created_at).toLocaleDateString()}</td>
    <td className="p-4">
      <div className="flex justify-end opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-end w-44">
          <ActionButton 
            onClick={() => onDownload(file.id, file.original_name)} 
            className="text-blue-600 hover:bg-blue-100 mr-2"
          >
            <Download className="w-4 h-4" />
          </ActionButton>
          <ActionButton 
            onClick={() => onDelete(file.id)} 
            className="text-red-600 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
          </ActionButton>
        </div>
      </div>
    </td>
  </tr>
);
