'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import type { FileData } from '@/types';
import { FileTable } from '@/components/FileTable';
import { UploadDropzone } from '@/components/UploadDropzone';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      const response = await apiFetch('/files', { method: 'GET' });
      setFiles(response as FileData[]);
    } catch (err) {
      setError('Could not load your files.');
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const blob = await apiFetch(`/files/${id}/download`, {
        method: 'GET',
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
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
      const blob = await apiFetch(`/files/${id}/download`, {
        method: 'GET',
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
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
        const response = await apiFetch(`/files/${id}/share`, { 
          method: 'GET' 
        }) as { share_url: string, expires_in: number };
        
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
      await apiFetch(`/files/${id}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to delete file.');
    }
  };

  if (loading) return <div>Loading session...</div>;
  if (!user) return null;

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
}
