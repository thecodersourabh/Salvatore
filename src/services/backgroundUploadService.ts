export interface UploadProgress {
  uploadId: string;
  progress: number;
  status: string;
  totalParts?: number;
}

export interface UploadTask {
  id: string;
  file: File;
  key: string;
  fileName: string;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (key: string) => void;
  onError?: (error: string) => void;
  partSize?: number;
}

class BackgroundUploadService {
  private worker: Worker | null = null;
  private activeTasks = new Map<string, UploadTask>();
  private progressMap = new Map<string, UploadProgress>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // For now, skip worker implementation and use main thread with async handling
    // This ensures reliable progress updates and simpler debugging
    this.worker = null;

  }

  /**
   * Handle async upload in main thread with proper progress tracking
   */
  private async handleAsyncUpload(task: UploadTask) {
    try {
      // Initial progress
      if (task.onProgress) {
        task.onProgress({
          uploadId: task.id,
          progress: 0,
          status: 'Starting upload...'
        });
      }

      // Import VideoService dynamically
      const { VideoService } = await import('./videoService');
      
      const result = await VideoService.uploadMultipart(
        task.file,
        task.key,
        (progress) => {

          if (task.onProgress) {
            task.onProgress({
              uploadId: task.id,
              progress,
              status: progress < 100 ? `Uploading... ${progress}%` : 'Finalizing upload...'
            });
          }
        },
        task.partSize || 8 * 1024 * 1024
      );

      // Final progress
      if (task.onProgress) {
        task.onProgress({
          uploadId: task.id,
          progress: 100,
          status: 'Upload completed!'
        });
      }

      // Completion callback
      if (task.onComplete) {
        setTimeout(() => {
          task.onComplete!(result);
        }, 100);
      }

      this.activeTasks.delete(task.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (task.onError) {
        task.onError(errorMessage);
      }
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Start a background upload task
   */
  async startUpload(task: UploadTask): Promise<string> {
    // Validate file size - maximum 20MB for videos
    const maxSizeBytes = 20 * 1024 * 1024; // 20 MB
    if (task.file.size > maxSizeBytes) {
      const fileSizeMB = Math.round(task.file.size / (1024 * 1024));
      const errorMessage = `Video file too large. Maximum size is 20 MB, but file is ${fileSizeMB} MB`;
      if (task.onError) {
        task.onError(errorMessage);
      }
      throw new Error(errorMessage);
    }

    // Generate unique upload ID if not provided
    if (!task.id) {
      task.id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    this.activeTasks.set(task.id, task);

    // Handle upload directly in main thread with setTimeout for non-blocking
    setTimeout(() => {
      this.handleAsyncUpload(task);
    }, 0);

    return task.id;
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): boolean {
    const task = this.activeTasks.get(uploadId);
    if (!task) return false;

    this.activeTasks.delete(uploadId);
    return true;
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): UploadTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get upload progress for a specific upload
   */
  getUploadProgress(uploadId: string): UploadProgress | undefined {
    return this.progressMap.get(uploadId);
  }

  /**
   * Get all upload progress data
   */
  getAllProgress(): Map<string, UploadProgress> {
    return new Map(this.progressMap);
  }

  /**
   * Check if an upload is active
   */
  isUploading(uploadId: string): boolean {
    return this.activeTasks.has(uploadId);
  }

  /**
   * Terminate the worker (cleanup)
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.activeTasks.clear();
  }
}

// Create singleton instance
export const backgroundUploadService = new BackgroundUploadService();