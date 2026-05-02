import { useAuth } from '@/features/auth/context/AuthContext';
import { useFileActions } from '@/features/files/hooks/useFileActions';
import { FileTable } from '@/features/files/components/FileTable';
import { UploadDropzone } from '@/features/files/components/UploadDropzone';
import { ImagePreviewModal } from '@/features/files/components/ImagePreviewModal';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

export default function DashboardPage() {
  return (
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const { 
    files, 
    filesLoading, 
    filesError, 
    error, 
    setError, 
    previewModal, 
    actions 
  } = useFileActions();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Meus Arquivos</h1>
              <p className="text-gray-500 mt-1">Logged in as {user.email}</p>
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
            onUploadSuccess={() => setError('')} 
            onError={setError}
          />

          {filesLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Loading files...
            </div>
          ) : (
            <FileTable 
              files={files} 
              onDownload={actions.download} 
              onPreview={actions.preview} 
              onShare={actions.share} 
              onDelete={actions.delete} 
            />
          )}
        </div>
        <ImagePreviewModal 
          isOpen={previewModal.isOpen}
          imageUrl={previewModal.url} 
          filename={previewModal.name} 
          onClose={previewModal.close} 
        />
      </div>
    </ProtectedRoute>
  );
}
