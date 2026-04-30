import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Download, UploadCloud, File as FileIcon, Eye, X, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface FileData {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchFiles();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Check file size and type.');
    } finally {
      setIsUploading(false);
    }
  };

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
  
  const handleShare = async (id: number) => {
      try {
        const response = await api.get(`/files/${id}/share`);
        const shareUrl = response.data.share_url;
  
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Shareable link copied to clipboard! Anyone with this link can download the file for the next hour.');
        } catch (clipboardErr) {
          window.prompt('Link generated successfully! Copy it from the field below:', shareUrl);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to generate share link from the server.');
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
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl); // Prevent memory leak
    }
    setPreviewUrl(null);
    setPreviewName('');
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Arquivos</h1>
            <p className="text-gray-500 mt-1">Logged in as {user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> (Max 10MB)
                </p>
                <p className="text-xs text-gray-500">.PNG, .JPG, .PDF, .TXT</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleUpload}
                disabled={isUploading}
                accept=".png,.jpg,.jpeg,.pdf,.txt"
              />
            </label>
          </div>
          {isUploading && <p className="text-center text-blue-600 mt-4 animate-pulse">Uploading file...</p>}
        </div>

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
                          onClick={() => handlePreview(file.id, file.original_name)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded mr-2 transition-colors inline-flex items-center"
                          title="Preview Image"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleShare(file.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded mr-2 transition-colors inline-flex items-center"
                        title="Copy Shareable Link"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDownload(file.id, file.original_name)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2 transition-colors inline-flex items-center"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
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
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium truncate pr-4">{previewName}</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100">
              <img 
                src={previewUrl} 
                alt={previewName} 
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};