import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FileData } from '../types';

const FILES_QUERY_KEY = ['files'];

export function useFiles() {
  return useQuery({
    queryKey: FILES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiFetch('/files', { method: 'GET', credentials: 'include' });
      return response as FileData[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiFetch('/files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      return response as FileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: number; filename: string }) => {
      const blob = await apiFetch(`/files/${fileId}/download`, {
        method: 'GET',
        credentials: 'include',
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
    },
  });
}

export function usePreviewFile() {
  return useMutation({
    mutationFn: async ({ fileId }: { fileId: number }) => {
      const blob = await apiFetch(`/files/${fileId}/download`, {
        method: 'GET',
        credentials: 'include',
        responseType: 'blob',
      });
      return window.URL.createObjectURL(blob);
    },
  });
}

export function useShareFile() {
  return useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiFetch(`/files/${fileId}/share`, {
        method: 'GET',
      });
      return response as { share_url: string; expires_in: number };
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileId: number) => {
      await apiFetch(`/files/${fileId}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: FILES_QUERY_KEY });
    },
  });
}
