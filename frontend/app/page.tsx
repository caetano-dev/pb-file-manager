'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useFiles, useDownloadFile, usePreviewFile, useShareFile, useDeleteFile, useUploadFile } from '@/features/files/api';
import { FileTable } from '@/features/files/components/FileTable';
import { UploadDropzone } from '@/features/files/components/UploadDropzone';
import { ImagePreviewModal } from '@/features/files/components/ImagePreviewModal';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const { data: files = [], isLoading: filesLoading, isError: filesError } = useFiles();
  const uploadFileMutation = useUploadFile();
  const downloadFileMutation = useDownloadFile();
  const previewFileMutation = usePreviewFile();
  const shareFileMutation = useShareFile();
  const deleteFileMutation = useDeleteFile();

  const handleDownload = async (id: number, filename: string) => {
    try {
      setError('');
      await downloadFileMutation.mutateAsync({ fileId: id, filename });
    } catch (err) {
      setError('Failed to download file.');
    }
  };

  const handlePreview = async (id: number, filename: string) => {
    try {
      setError('');
      const url = await previewFileMutation.mutateAsync({ fileId: id });
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
      setError('');
      const response = await shareFileMutation.mutateAsync(id);
      
      try {
        await navigator.clipboard.writeText(response.share_url);
        
        const hours = Math.round(response.expires_in / 3600);
        alert(`Shareable link copied to clipboard. It expires in ${hours} hour(s).`);
      } catch (clipboardErr) {
        window.prompt('Link generated successfully:', response.share_url);
      }
    } catch (err) {
      setError('Failed to generate share link.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      setError('');
      await deleteFileMutation.mutateAsync(id);
    } catch (err) {
      setError('Failed to delete file.');
    }
  };

  const handleUploadSuccess = () => {
    setError('');
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) return <div>Loading session...</div>;
  if (!user) return null;

  return (
    <ProtectedRoute>
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

          {filesError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
              Failed to load files
            </div>
          )}

          <UploadDropzone 
            onUploadSuccess={handleUploadSuccess} 
            onError={handleUploadError}
          />

          {filesLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Loading files...
            </div>
          ) : (
            <FileTable 
              files={files} 
              onDownload={handleDownload} 
              onPreview={handlePreview} 
              onShare={handleShare} 
              onDelete={handleDelete} 
            />
          )}
        </div>
        <ImagePreviewModal url={previewUrl} name={previewName} onClose={closePreview} />
      </div>
    </ProtectedRoute>
  );
}
