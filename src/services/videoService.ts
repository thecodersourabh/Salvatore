import { getStoredToken } from '../utils/tokenHelper';

const API_BASE_URL = import.meta.env.VITE_CDN_API_URL;

export interface MultipartInitResponse {
  uploadId: string;
  key: string;
  bucket?: string;
  partSize?: number;
  cdnUrl?: string;
}

export class VideoService {
  /**
   * Initialize multipart upload via backend which returns presigned URLs for parts
   */
  static async initMultipartUpload(key: string, contentType: string, partSize: number = 8 * 1024 * 1024): Promise<MultipartInitResponse> {
    if (!API_BASE_URL) throw new Error('API_BASE_URL not configured');
    const url = `${API_BASE_URL.replace(/\/$/, '')}/upload/multipart/init`;
    // Debugging: log request details to help diagnose UI vs console fetch differences
      try {
        console.debug('[VideoService] initMultipartUpload (direct fetch) ->', { apiBase: API_BASE_URL, url, payload: { key, contentType, partSize } });
        const token = getStoredToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const userId = localStorage.getItem('x-user-id');
        if (userId) headers['x-user-id'] = userId;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ key, contentType, partSize })
        });

        const text = await response.text();
        let parsed: any = null;
        try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }

        if (!response.ok) {
          console.debug('[VideoService] initMultipartUpload response not ok ->', response.status, parsed);
          throw new Error(parsed?.message || `Init multipart failed: ${response.status}`);
        }

        console.debug('[VideoService] initMultipartUpload response ->', parsed);
        return parsed as MultipartInitResponse;
    } catch (err) {
      console.error('[VideoService] initMultipartUpload failed', err);
      throw err;
    }
  }

  /**
   * Get presigned URL for a specific part
   */
  static async getPartPresignedUrl(key: string, uploadId: string, partNumber: number): Promise<{ url: string }> {
    if (!API_BASE_URL) throw new Error('API_BASE_URL not configured');
    const url = `${API_BASE_URL.replace(/\/$/, '')}/upload/multipart/part`;
    
    try {
      console.debug('[VideoService] getPartPresignedUrl (direct fetch) ->', { url, payload: { key, uploadId, partNumber } });
      const token = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const userId = localStorage.getItem('x-user-id');
      if (userId) headers['x-user-id'] = userId;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, uploadId, partNumber })
      });

      const text = await response.text();
      let parsed: any = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }

      if (!response.ok) {
        console.debug('[VideoService] getPartPresignedUrl response not ok ->', response.status, parsed);
        throw new Error(parsed?.message || `Get part presigned URL failed: ${response.status}`);
      }

      console.debug('[VideoService] getPartPresignedUrl response ->', parsed);
      return parsed as { url: string };
    } catch (err) {
      console.error('[VideoService] getPartPresignedUrl failed', err);
      throw err;
    }
  }

  /**
   * Complete multipart upload by sending ETags and part numbers to backend
   */
  static async completeMultipartUpload(key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>): Promise<{ success: boolean; key: string }> {
    if (!API_BASE_URL) throw new Error('API_BASE_URL not configured');
    const url = `${API_BASE_URL.replace(/\/$/, '')}/upload/multipart/complete`;
      try {
        console.debug('[VideoService] completeMultipartUpload (direct fetch) ->', { url, payload: { key, uploadId, parts } });
        const token = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const userId = localStorage.getItem('x-user-id');
        if (userId) headers['x-user-id'] = userId;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ key, uploadId, parts })
        });

        const text = await response.text();
        let parsed: any = null;
        try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }

        if (!response.ok) {
          console.debug('[VideoService] completeMultipartUpload response not ok ->', response.status, parsed);
          throw new Error(parsed?.message || `Complete multipart failed: ${response.status}`);
        }

        console.debug('[VideoService] completeMultipartUpload response ->', parsed);
        return parsed as { success: boolean; key: string };
    } catch (err) {
      console.error('[VideoService] completeMultipartUpload failed', err);
      throw err;
    }
  }

  /**
   * Upload a single part using XMLHttpRequest to support progress callbacks
   */
  static uploadPart(url: string, blob: Blob, onProgress?: (loaded: number) => void): Promise<{ ETag: string }> {
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        // Don't set Content-Type - let browser set it or leave empty to match presigned URL
        xhr.upload.onprogress = (ev: ProgressEvent) => {
          if (ev.lengthComputable && onProgress) onProgress(ev.loaded);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag') || '';
            resolve({ ETag: etag.replace(/"/g, '') });
          } else {
            console.error(`[VideoService] Part upload failed:`, {
              status: xhr.status,
              statusText: xhr.statusText,
              response: xhr.responseText
            });
            reject(new Error(`Part upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during part upload'));
        xhr.send(blob);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * High-level multipart uploader that requests presigned URLs from backend, uploads parts in parallel,
   * reports overall progress and completes upload.
   */
  static async uploadMultipart(file: File, key: string, onProgress?: (percent: number) => void, partSize = 8 * 1024 * 1024): Promise<string> {
    // Validate file size - maximum 20MB for videos
    const maxSizeBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSizeBytes) {
      throw new Error(`Video file too large. Maximum size is 20 MB, but file is ${Math.round(file.size / (1024 * 1024))} MB`);
    }

    // 1) Init multipart upload
    console.debug('[VideoService] uploadMultipart start', { key, size: file.size, partSize });
    const init = await VideoService.initMultipartUpload(key, file.type, partSize);
    console.debug('[VideoService] init response:', init);

    if (!init.uploadId) {
      throw new Error('Multipart init did not return uploadId. Response: ' + JSON.stringify(init));
    }

    // Calculate how many parts we need
    const totalSize = file.size;
    const totalParts = Math.ceil(totalSize / partSize);
    console.debug('[VideoService] calculated total parts:', totalParts);
    
    let uploadedBytes = 0;
    const partsResult: Array<{ ETag: string; PartNumber: number }> = [];

    // Helper to upload a single part and track progress
    const uploadSingle = async (partIndex: number): Promise<{ ETag: string; PartNumber: number }> => {
      const partNumber = partIndex + 1; // Part numbers are 1-based
      const start = partIndex * partSize;
      const end = Math.min(start + partSize, totalSize);
      const blob = file.slice(start, end);
      
      console.debug(`[VideoService] uploading part ${partNumber}/${totalParts}`, { start, end, size: blob.size });
      
      // Get presigned URL for this specific part
      const partResponse = await VideoService.getPartPresignedUrl(init.key, init.uploadId, partNumber);
      
      let lastLoadedForPart = 0;
      const res = await VideoService.uploadPart(partResponse.url, blob, (loaded) => {
        // loaded is bytes for this part
        const delta = loaded - lastLoadedForPart;
        lastLoadedForPart = loaded;
        uploadedBytes += delta;
        if (onProgress) onProgress(Math.round((uploadedBytes / totalSize) * 100));
      });
      
      // When finished, ensure uploadedBytes accounts for remaining
      const remainingForPart = (end - start) - lastLoadedForPart;
      if (remainingForPart > 0) {
        uploadedBytes += remainingForPart;
        if (onProgress) onProgress(Math.round((uploadedBytes / totalSize) * 100));
      }
      
      console.debug(`[VideoService] completed part ${partNumber}`, { ETag: res.ETag });
      return { ETag: res.ETag, PartNumber: partNumber };
    };

    // Upload parts sequentially to avoid overwhelming the server
    console.debug('[VideoService] starting sequential part uploads');
    for (let i = 0; i < totalParts; i++) {
      try {
        const partResult = await uploadSingle(i);
        partsResult.push(partResult);
      } catch (error) {
        console.error(`[VideoService] failed to upload part ${i + 1}:`, error);
        throw new Error(`Failed to upload part ${i + 1}: ${error}`);
      }
    }

    // Ensure parts are sorted by PartNumber before completing
    if (partsResult && partsResult.length > 0) {
      partsResult.sort((a, b) => a.PartNumber - b.PartNumber);
      console.debug('[VideoService] sorted parts for completion:', partsResult);
    } else {
      throw new Error('No parts were successfully uploaded');
    }

    // Complete multipart upload via backend
    console.debug('[VideoService] completing multipart upload');
    await VideoService.completeMultipartUpload(init.key, init.uploadId, partsResult);

    return init.key;
  }
}

export default VideoService;
