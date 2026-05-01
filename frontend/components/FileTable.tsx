'use client';

import { Trash2, Download, File as FileIcon, Eye, Share2, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import type { FileData } from '@/types';

interface FileTableProps {
  files: FileData[];
  onDownload: (id: number, filename: string) => void;
  onPreview: (id: number, filename: string) => void;
  onShare: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FileTable: React.FC<FileTableProps> = ({ files, onDownload, onPreview, onShare, onDelete }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.original_name]) {
      acc[file.original_name] = [];
    }
    acc[file.original_name].push(file);
    return acc;
  }, {} as Record<string, FileData[]>);

  Object.keys(groupedFiles).forEach(key => {
    groupedFiles[key].sort((a, b) => b.version - a.version);
  });

  const toggleGroup = (filename: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedGroups(newExpanded);
  };

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
          {Object.keys(groupedFiles).length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500">
                No files uploaded yet.
              </td>
            </tr>
          ) : (
            Object.entries(groupedFiles).map(([filename, fileVersions]) => {
              const latestFile = fileVersions[0];
              const hasHistory = fileVersions.length > 1;
              const isExpanded = expandedGroups.has(filename);

              return (
                <React.Fragment key={filename}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      {hasHistory ? (
                        <button onClick={() => toggleGroup(filename)} className="text-gray-400 hover:text-gray-700 transition-colors">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      ) : (
                        <div className="w-5 h-5" /> 
                      )}
                      <FileIcon className="text-gray-400 w-5 h-5" />
                      <span className="font-medium text-gray-800">{latestFile.original_name}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                        v{latestFile.version}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{formatBytes(latestFile.size)}</td>
                    <td className="p-4 text-gray-600">{new Date(latestFile.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
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
                    </td>
                  </tr>

                  {isExpanded && fileVersions.slice(1).map(oldFile => (
                    <tr key={oldFile.id} className="bg-gray-50 border-b border-gray-100 text-sm">
                      <td className="p-4 pl-16 flex items-center gap-3 text-gray-500">
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          v{oldFile.version}
                        </span>
                        <span>{oldFile.original_name}</span>
                      </td>
                      <td className="p-4 text-gray-500">{formatBytes(oldFile.size)}</td>
                      <td className="p-4 text-gray-500">{new Date(oldFile.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right opacity-80 hover:opacity-100 transition-opacity">
                        <button onClick={() => onDownload(oldFile.id, oldFile.original_name)} className="p-2 text-blue-600 hover:bg-blue-100 rounded mr-2 transition-colors inline-flex items-center">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(oldFile.id)} className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors inline-flex items-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};