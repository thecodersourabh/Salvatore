import { UPLOAD_LIMITS } from '../../constants';

export function SectorServiceSelector(_: any) {
  return null; // Not implemented in this PR
}

export function MediaUploadSection({
  imagePreviews,
  existingImages,
  videos,
  videoPreviews,
  existingVideos,
  handleImageAdd,
  handleRemoveImage,
  handleVideoAdd,
  handleRemoveVideo,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  isDragging,
  submitting,
  imageUploadProgress,
  videoUploadProgress,
  showValidationError
}: any) {
  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Media</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Service Media
          </label>
          <div className="flex space-x-4 text-xs text-gray-500">
            <span>{`Up to ${UPLOAD_LIMITS.IMAGES.MAX_COUNT} images`}</span>
            <span>•</span>
            <span>{`Up to ${UPLOAD_LIMITS.VIDEOS.MAX_COUNT} videos (${UPLOAD_LIMITS.VIDEOS.MAX_SIZE_MB}MB max)`}</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const videoFiles = Array.from(files).filter((file: File) => file.type.startsWith('video/'));
              const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));

              if (videoFiles.length > 0) {
                const maxVideos = UPLOAD_LIMITS.VIDEOS.MAX_COUNT;
                const remainingSlots = maxVideos - (videos.length + existingVideos.length);
                if (remainingSlots > 0) {
                  const toAdd = videoFiles.slice(0, remainingSlots);
                  toAdd.forEach((file: File) => handleVideoAdd(file));
                } else {
                  showValidationError(`Maximum ${maxVideos} videos allowed. Remove existing videos to add new ones.`, 'video');
                }
              }

              if (imageFiles.length > 0) {
                const dt = new DataTransfer();
                imageFiles.forEach((f: File) => dt.items.add(f));
                handleImageAdd(dt.files);
              }

              (e.target as HTMLInputElement).value = '';
            }}
            className="hidden"
            id="image-upload"
            disabled={submitting}
          />

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 ${isDragging ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-dashed border-gray-200 dark:border-gray-700'} rounded-lg p-6 flex items-center justify-center text-center`}
          >
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Drag & drop images or videos here, or <label htmlFor="image-upload" className="text-rose-600 cursor-pointer">browse</label></div>
              <div className="text-xs text-gray-400">We recommend using JPEG/PNG images and MP4 videos.</div>
            </div>
          </div>

          {(imagePreviews.length > 0 || videoPreviews.length > 0 || existingImages.length > 0 || existingVideos.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Existing images */}
              {existingImages.map((img: any, i: number) => (
                <div key={`existing-${i}`} className="relative group">
                  <div className="aspect-square w-12 sm:w-16 md:w-20 lg:w-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={img.url} className="w-full h-full object-cover" alt={`Service image ${i + 1}`} />
                  </div>
                  <button type="button" onClick={() => handleRemoveImage(i)} disabled={submitting} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">×</button>
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((src: string, i: number) => (
                <div key={src} className="relative group">
                  <div className="aspect-square w-12 sm:w-16 md:w-20 lg:w-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={src} className="w-full h-full object-cover" alt={`Service image ${i + 1}`} />
                  </div>
                  <button type="button" onClick={() => handleRemoveImage(existingImages.length + i)} disabled={submitting} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">×</button>
                </div>
              ))}

              {/* Existing videos */}
              {existingVideos.map((video: any, i: number) => (
                <div key={`existing-video-${i}`} className="relative group">
                  <div className="aspect-square w-12 sm:w-16 md:w-20 lg:w-24 rounded-lg overflow-hidden bg-gray-900">
                    <video src={video.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveVideo(i)} disabled={submitting} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">×</button>
                </div>
              ))}

              {/* New videos */}
              {videoPreviews.map((src: string, i: number) => (
                <div key={src} className="relative group">
                  <div className="aspect-square w-12 sm:w-16 md:w-20 lg:w-24 rounded-lg overflow-hidden bg-gray-900">
                    <video src={src} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveVideo(existingVideos.length + i)} disabled={submitting} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">×</button>
                </div>
              ))}
            </div>
          )}

          {imageUploadProgress !== null && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Uploading images — {imageUploadProgress}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div style={{ width: `${imageUploadProgress}%` }} className="h-2 bg-rose-600"></div></div>
            </div>
          )}

          {videoUploadProgress !== null && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Uploading video — {videoUploadProgress}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div style={{ width: `${videoUploadProgress}%` }} className="h-2 bg-blue-600"></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TierConfiguration(_: any) {
  return null; // not implemented in this PR
}

export function BottomActions(_: any) {
  return null; // not implemented in this PR
}
