import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { FileData } from '../types';
import { FileTable } from '../components/FileTable';
import { UploadDropzone } from '../components/UploadDropzone';
import { ImagePreviewModal } from '../components/ImagePreviewModal';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState('');
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const fetchFiles = async () => {
    try {
      const response = await api.get<FileData[]>('/files/');
      setFiles(response.data);
    } catch (err) {
      setError('Could not load your files.');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (id: number, filename: string) => {
    try {
      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file.');
    }
  };

  const handlePreview = async (id: number, filename: string) => {
    try {
      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
      setPreviewName(filename);
    } catch (err) {
      setError('Failed to load preview.');
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName('');
  };

  const handleShare = async (id: number) => {
    try {
      const response = await api.get(`/files/${id}/share`);
      const shareUrl = response.data.share_url;
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Shareable link copied to clipboard.');
      } catch (clipboardErr) {
        window.prompt('Link generated successfully.', shareUrl);
      }
    } catch (err) {
      setError('Failed to generate share link.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to delete file.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Arquivos</h1>
            <p className="text-gray-500 mt-1">Logged in as {user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
            {error}
          </div>
        )}
        <UploadDropzone onUploadSuccess={fetchFiles} onError={setError} />
        <FileTable 
          files={files} 
          onDownload={handleDownload} 
          onPreview={handlePreview} 
          onShare={handleShare} 
          onDelete={handleDelete} 
        />
      </div>
      <ImagePreviewModal url={previewUrl} name={previewName} onClose={closePreview} />
    </div>
  );
};