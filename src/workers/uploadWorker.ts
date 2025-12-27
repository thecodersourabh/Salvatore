// Upload Worker for handling large file uploads in the background

interface UploadMessage {
  type: 'UPLOAD_START' | 'UPLOAD_PROGRESS' | 'UPLOAD_SUCCESS' | 'UPLOAD_ERROR' | 'UPLOAD_CANCEL' | 'REQUEST_DATA';
  payload?: any;
}

interface UploadTask {
  id: string;
  file: File;
  key: string;
  onProgress?: (progress: number) => void;
  partSize?: number;
}

class BackgroundUploader {
  private activeUploads = new Map<string, { controller: AbortController; task: UploadTask }>();
  private API_BASE_URL: string;

  constructor() {
    // Initialize API base from env (fallback to empty string)
    this.API_BASE_URL = (import.meta.env.VITE_CDN_API_URL as string) || '';
    // Listen for messages from main thread
    self.onmessage = this.handleMessage.bind(this);
  }

  private async handleMessage(event: MessageEvent<UploadMessage>) {
    const { type, payload } = event.data;

    switch (type) {
      case 'UPLOAD_START':
        await this.startUpload(payload);
        break;
      case 'UPLOAD_CANCEL':
        this.cancelUpload(payload.uploadId);
        break;
    }
  }

  private async startUpload(task: UploadTask) {
    const controller = new AbortController();
    this.activeUploads.set(task.id, { controller, task });

    try {
      // Validate file size - maximum 20MB for videos
      const maxSizeBytes = 20 * 1024 * 1024; // 20 MB
      if (task.file.size > maxSizeBytes) {
        throw new Error(`File too large. Maximum size is 20 MB, but file is ${Math.round(task.file.size / (1024 * 1024))} MB`);
      }

      // Set API base URL from task key (if provided) otherwise use env
      this.API_BASE_URL = task.key.includes('execute-api')
        ? task.key.split('/upload')[0]
        : ((import.meta.env.VITE_CDN_API_URL as string) || '');

      this.postMessage({
        type: 'UPLOAD_PROGRESS',
        payload: { uploadId: task.id, progress: 0, status: 'initializing' }
      });

      const result = await this.uploadMultipart(task, controller.signal);

      this.postMessage({
        type: 'UPLOAD_SUCCESS',
        payload: { uploadId: task.id, key: result }
      });

    } catch (error) {
      if (controller.signal.aborted) {
        this.postMessage({
          type: 'UPLOAD_CANCEL',
          payload: { uploadId: task.id }
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.postMessage({
          type: 'UPLOAD_ERROR',
          payload: { uploadId: task.id, error: errorMessage }
        });
      }
    } finally {
      this.activeUploads.delete(task.id);
    }
  }

  private cancelUpload(uploadId: string) {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.controller.abort();
      this.activeUploads.delete(uploadId);
    }
  }

  private async uploadMultipart(task: UploadTask, signal: AbortSignal): Promise<string> {
    const { file, key } = task;
    const partSize = task.partSize || 8 * 1024 * 1024;

    // Get stored token and user ID from main thread storage
    const token = await this.getFromMainThread('getStoredToken');
    const userId = await this.getFromMainThread('getUserId');

    // 1) Init multipart upload
    const init = await this.initMultipartUpload(key, file.type, partSize, token, userId, signal);
    
    if (!init.uploadId) {
      throw new Error('Multipart init did not return uploadId');
    }

    // Calculate parts
    const totalSize = file.size;
    const totalParts = Math.ceil(totalSize / partSize);
    
    this.postMessage({
      type: 'UPLOAD_PROGRESS',
      payload: { uploadId: task.id, progress: 5, status: 'uploading', totalParts }
    });

    const partsResult: Array<{ ETag: string; PartNumber: number }> = [];
    let uploadedBytes = 0;

    // Upload parts sequentially with progress reporting
    for (let i = 0; i < totalParts; i++) {
      if (signal.aborted) throw new Error('Upload cancelled');

      const partNumber = i + 1;
      const start = i * partSize;
      const end = Math.min(start + partSize, totalSize);
      const blob = file.slice(start, end);

      // Get presigned URL for this part
      const partResponse = await this.getPartPresignedUrl(init.key, init.uploadId, partNumber, token, userId, signal);
      
      // Upload part
      const partResult = await this.uploadPart(partResponse.url, blob, signal, (loaded) => {
        const partProgress = (uploadedBytes + loaded) / totalSize;
        const overallProgress = Math.min(5 + (partProgress * 90), 95); // 5-95% for upload
        
        this.postMessage({
          type: 'UPLOAD_PROGRESS',
          payload: { 
            uploadId: task.id, 
            progress: Math.round(overallProgress),
            status: `uploading part ${partNumber}/${totalParts}`
          }
        });
      });

      uploadedBytes += blob.size;
      partsResult.push({ ETag: partResult.ETag, PartNumber: partNumber });
    }

    this.postMessage({
      type: 'UPLOAD_PROGRESS',
      payload: { uploadId: task.id, progress: 95, status: 'finalizing' }
    });

    // Complete multipart upload
    partsResult.sort((a, b) => a.PartNumber - b.PartNumber);
    await this.completeMultipartUpload(init.key, init.uploadId, partsResult, token, userId, signal);

    return init.key;
  }

  private async initMultipartUpload(key: string, contentType: string, partSize: number, token: string, userId: string, signal: AbortSignal) {
    const response = await fetch(`${this.API_BASE_URL}/upload/multipart/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({ key, contentType, partSize }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Init failed: ${response.status}`);
    }

    return response.json();
  }

  private async getPartPresignedUrl(key: string, uploadId: string, partNumber: number, token: string, userId: string, signal: AbortSignal) {
    const response = await fetch(`${this.API_BASE_URL}/upload/multipart/part`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({ key, uploadId, partNumber }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Get part URL failed: ${response.status}`);
    }

    return response.json();
  }

  private async uploadPart(url: string, blob: Blob, signal: AbortSignal, onProgress?: (loaded: number) => void): Promise<{ ETag: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      const cleanup = () => {
        signal.removeEventListener('abort', abortHandler);
      };

      const abortHandler = () => {
        xhr.abort();
        cleanup();
        reject(new Error('Upload cancelled'));
      };

      signal.addEventListener('abort', abortHandler);

      xhr.upload.onprogress = (ev: ProgressEvent) => {
        if (ev.lengthComputable && onProgress) {
          onProgress(ev.loaded);
        }
      };

      xhr.onload = () => {
        cleanup();
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag') || '';
          resolve({ ETag: etag.replace(/"/g, '') });
        } else {
          reject(new Error(`Part upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        cleanup();
        reject(new Error('Network error during part upload'));
      };

      xhr.open('PUT', url, true);
      xhr.send(blob);
    });
  }

  private async completeMultipartUpload(key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>, token: string, userId: string, signal: AbortSignal) {
    const response = await fetch(`${this.API_BASE_URL}/upload/multipart/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({ key, uploadId, parts }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Complete failed: ${response.status}`);
    }

    return response.json();
  }

  private async getFromMainThread(method: string): Promise<string> {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.postMessage({
        type: 'REQUEST_DATA',
        payload: { method, port: channel.port2 }
      }, [channel.port2]);
    });
  }

  private postMessage(message: UploadMessage, transfer?: Transferable[]) {
    (self as any).postMessage(message, transfer);
  }
}

// Initialize the worker
new BackgroundUploader();