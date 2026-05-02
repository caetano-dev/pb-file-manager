'use client';

import { useMemo } from 'react';
import type { FileData } from '../types';
import { FileRowGroup } from './FileRowGroup';

interface FileTableProps {
  files: FileData[];
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FileTable = ({ 
  files, 
  onDownload, 
  onPreview, 
  onShare, 
  onDelete 
} : FileTableProps) => {
  
  const groupedFiles = useMemo(() => {
    const groups = files.reduce((acc, file) => {
      if (!acc[file.original_name]) {
        acc[file.original_name] = [];
      }
      acc[file.original_name].push(file);
      return acc;
    }, {} as Record<string, FileData[]>);

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.version - a.version);
    });

    return groups;
  }, [files]);

  return (
    <div className="space-y-4 md:space-y-0">
      {Object.keys(groupedFiles).length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 p-8 text-center text-gray-500">
          No files uploaded yet.
        </div>
      ) : (
        <>
          {/* Mobile view - card layout */}
          <div className="md:hidden space-y-4">
            {Object.entries(groupedFiles).map(([filename, fileVersions]) => (
              <FileRowGroup 
                key={filename}
                filename={filename}
                fileVersions={fileVersions}
                onDownload={onDownload}
                onPreview={onPreview}
                onShare={onShare}
                onDelete={onDelete}
                isMobile={true}
              />
            ))}
          </div>

          {/* Desktop view - table layout */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <th className="p-4 font-medium text-left">Name</th>
                  <th className="p-4 font-medium text-left">Size</th>
                  <th className="p-4 font-medium text-left">Uploaded</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedFiles).map(([filename, fileVersions]) => (
                  <FileRowGroup 
                    key={filename}
                    filename={filename}
                    fileVersions={fileVersions}
                    onDownload={onDownload}
                    onPreview={onPreview}
                    onShare={onShare}
                    onDelete={onDelete}
                    isMobile={false}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
