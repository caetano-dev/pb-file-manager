import { useState } from 'react';
import { useUploadFile } from '../api';

export function useFileUpload(onSuccess: () => void, onError: (msg: string) => void) {
  const uploadMutation = useUploadFile();

  const handleUpload = async (file: File | undefined, resetInput: () => void) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onError('File size exceeds the 10MB limit.');
      resetInput();
      return;
    }

    onError('');

    try {
      await uploadMutation.mutateAsync(file);
      onSuccess();
      resetInput();
    } catch (err: any) {
      onError(err.response?.data?.detail || 'Upload failed. Check file size and type.');
    }
  };

  return { handleUpload, isPending: uploadMutation.isPending };
}