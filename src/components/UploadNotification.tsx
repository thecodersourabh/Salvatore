import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { backgroundUploadService, UploadProgress, UploadTask } from '../services/backgroundUploadService';

interface UploadNotificationProps {
  className?: string;
}

interface ActiveUpload extends UploadTask {
  progress?: UploadProgress;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  completedKey?: string;
}

export const UploadNotification: React.FC<UploadNotificationProps> = ({ className = '' }) => {
  const [uploads, setUploads] = useState<Map<string, ActiveUpload>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Monitor active uploads from the background service
    const syncUploads = () => {
      const activeUploads = backgroundUploadService.getActiveUploads();
      const allProgress = backgroundUploadService.getAllProgress();
      
      if (activeUploads.length > 0 || allProgress.size > 0) {
        const newUploads = new Map<string, ActiveUpload>();
        
        // Convert service uploads to UI format
        activeUploads.forEach(task => {
          const progress = backgroundUploadService.getUploadProgress(task.id);
          newUploads.set(task.id, {
            ...task,
            status: progress ? (progress.progress === 100 ? 'completed' : 'uploading') : 'uploading',
            progress: progress || {
              uploadId: task.id,
              progress: 0,
              status: 'Starting upload...'
            }
          });
        });
        
        // Also add any uploads that have progress but might not be in active list (completed ones)
        allProgress.forEach((progressData, uploadId) => {
          if (!newUploads.has(uploadId)) {
            // Find the task or create a minimal one
            const task = activeUploads.find(t => t.id === uploadId) || {
              id: uploadId,
              file: new File([''], 'unknown'),
              key: '',
              fileName: 'Unknown file'
            };
            
            newUploads.set(uploadId, {
              ...task,
              status: progressData.progress === 100 ? 'completed' : 'uploading',
              progress: progressData
            });
          }
        });
        
        setUploads(newUploads);
        setIsVisible(true);
      } else if (uploads.size === 0) {
        setIsVisible(false);
      }
    };

    const interval = setInterval(syncUploads, 500); // Update more frequently for better progress tracking
    syncUploads(); // Initial sync
    
    return () => clearInterval(interval);
  }, [uploads.size]);

  // Listen for upload progress updates
  useEffect(() => {
    const handleStorageChange = () => {
      // Re-sync when uploads change
      const activeUploads = backgroundUploadService.getActiveUploads();
      setIsVisible(activeUploads.length > 0 || uploads.size > 0);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [uploads.size]);

  // startBackgroundUpload function moved to backgroundUploadService

  const cancelUpload = (uploadId: string) => {
    backgroundUploadService.cancelUpload(uploadId);
    setUploads(prev => {
      const updated = new Map(prev);
      const upload = updated.get(uploadId);
      if (upload) {
        upload.status = 'cancelled';
        updated.set(uploadId, upload);
      }
      return updated;
    });
    
    // Remove cancelled uploads after 2 seconds
    setTimeout(() => {
      setUploads(prev => {
        const updated = new Map(prev);
        updated.delete(uploadId);
        return updated;
      });
    }, 2000);
  };

  const dismissUpload = (uploadId: string) => {
    setUploads(prev => {
      const updated = new Map(prev);
      updated.delete(uploadId);
      return updated;
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (upload: ActiveUpload) => {
    switch (upload.status) {
      case 'uploading':
        return upload.progress?.status || 'Uploading...';
      case 'completed':
        return 'Upload completed';
      case 'error':
        return upload.error || 'Upload failed';
      case 'cancelled':
        return 'Upload cancelled';
      default:
        return 'Preparing...';
    }
  };

  if (!isVisible || uploads.size === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${className}`}>
      {Array.from(uploads.values()).map((upload) => (
        <div
          key={upload.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-80 max-w-96"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(upload.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {upload.fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(upload.file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissUpload(upload.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getStatusText(upload)}
            </p>
          </div>

          {upload.status === 'uploading' && upload.progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-700 dark:text-gray-300">{upload.progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress.progress}%` }}
                ></div>
              </div>
              {upload.progress.totalParts && (
                <p className="text-xs text-gray-500">
                  {upload.progress.status}
                </p>
              )}
            </div>
          )}

          {upload.status === 'uploading' && (
            <button
              onClick={() => cancelUpload(upload.id)}
              className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Cancel Upload
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

  // Export the background upload starter function for use in other components
  export { backgroundUploadService };