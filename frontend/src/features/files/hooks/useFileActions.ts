import { useState } from 'react';
import { 
  useFiles, 
  useDownloadFile, 
  usePreviewFile, 
  useShareFile, 
  useDeleteFile 
} from '../api';

export function useFileActions() {
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const { data: files = [], isLoading: filesLoading, isError: filesError } = useFiles();
  const downloadFileMutation = useDownloadFile();
  const previewFileMutation = usePreviewFile();
  const shareFileMutation = useShareFile();
  const deleteFileMutation = useDeleteFile();

  const handleDownload = async (id: number, filename: string) => {
    try {
      setError('');
      await downloadFileMutation.mutateAsync({ fileId: id, filename });
    } catch {
      setError('Failed to download file.');
    }
  };

  const handlePreview = async (id: number, filename: string) => {
    try {
      setError('');
      const url = await previewFileMutation.mutateAsync({ fileId: id });
      setPreviewUrl(url);
      setPreviewName(filename);
    } catch {
      setError('Failed to load preview.');
    }
  };

  const closePreview = () => {
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
      } catch {
        window.prompt('Link generated successfully:', response.share_url);
      }
    } catch {
      setError('Failed to generate share link.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      setError('');
      await deleteFileMutation.mutateAsync(id);
    } catch {
      setError('Failed to delete file.');
    }
  };

  const clearError = () => setError('');

  return {
    files,
    filesLoading,
    filesError,
    error,
    setError,
    clearError,
    previewModal: {
      isOpen: !!previewUrl,
      url: previewUrl,
      name: previewName,
      close: closePreview,
    },
    actions: {
      download: handleDownload,
      preview: handlePreview,
      share: handleShare,
      delete: handleDelete,
    }
  };
}