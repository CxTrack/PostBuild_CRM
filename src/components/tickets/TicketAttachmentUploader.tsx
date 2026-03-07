/**
 * TicketAttachmentUploader
 * Multi-file upload component for ticket submissions and replies.
 * Supports drag-and-drop, click-to-browse, progress indicators.
 * Max 5 files, 10MB each. Uploads immediately on selection.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, X, Upload, Image, FileText, Film, Loader2, AlertCircle } from 'lucide-react';
import {
  uploadTicketAttachment,
  deleteTicketAttachment,
  validateAttachment,
  formatFileSize,
  isImageType,
  type AttachmentMeta,
} from '@/utils/ticketAttachments';

interface TicketAttachmentUploaderProps {
  organizationId: string;
  ticketOrDraftId: string;
  attachments: AttachmentMeta[];
  onAttachmentsChange: (attachments: AttachmentMeta[]) => void;
  maxFiles?: number;
  compact?: boolean; // Smaller layout for inline use
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  previewUrl?: string;
  status: 'uploading' | 'error';
  error?: string;
}

const TicketAttachmentUploader: React.FC<TicketAttachmentUploaderProps> = ({
  organizationId,
  ticketOrDraftId,
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  compact = false,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalFiles = attachments.length + uploading.filter(u => u.status === 'uploading').length;
  const canUploadMore = totalFiles < maxFiles && !disabled;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (attachments.length + uploading.length >= maxFiles) break;

      // Validate first
      const validationError = validateAttachment(file);
      if (validationError) {
        setUploading(prev => [...prev, {
          file,
          status: 'error' as const,
          error: validationError,
        }]);
        // Auto-clear error after 4s
        setTimeout(() => {
          setUploading(prev => prev.filter(u => u.file !== file));
        }, 4000);
        continue;
      }

      // Create preview for images
      const previewUrl = isImageType(file.type) ? URL.createObjectURL(file) : undefined;

      // Add to uploading state
      const uploadingEntry: UploadingFile = { file, previewUrl, status: 'uploading' };
      setUploading(prev => [...prev, uploadingEntry]);

      try {
        const meta = await uploadTicketAttachment(file, organizationId, ticketOrDraftId);
        // Success: remove from uploading, add to attachments
        setUploading(prev => prev.filter(u => u.file !== file));
        onAttachmentsChange([...attachments, meta]);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      } catch (err: any) {
        // Error: update status
        setUploading(prev => prev.map(u =>
          u.file === file ? { ...u, status: 'error' as const, error: err.message || 'Upload failed' } : u
        ));
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        // Auto-clear error after 4s
        setTimeout(() => {
          setUploading(prev => prev.filter(u => u.file !== file));
        }, 4000);
      }
    }
  }, [attachments, uploading, maxFiles, organizationId, ticketOrDraftId, onAttachmentsChange]);

  const handleRemove = async (idx: number) => {
    const attachment = attachments[idx];
    const updated = attachments.filter((_, i) => i !== idx);
    onAttachmentsChange(updated);
    // Fire-and-forget cleanup
    deleteTicketAttachment(attachment.file_url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (canUploadMore && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [canUploadMore, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (canUploadMore) setDragOver(true);
  }, [canUploadMore]);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={14} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Film size={14} className="text-purple-500" />;
    return <FileText size={14} className="text-red-500" />;
  };

  // Compact mode: just a button + file chips
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleInputChange}
          accept="image/*,.pdf,video/mp4"
          multiple
        />

        {/* Attached files */}
        {attachments.map((a, idx) => (
          <div
            key={a.file_url}
            className="group relative inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1"
          >
            {getFileIcon(a.file_type)}
            <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{a.file_name}</span>
            <button
              onClick={() => handleRemove(idx)}
              className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Uploading indicators */}
        {uploading.map((u, idx) => (
          <div key={`uploading-${idx}`} className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
            {u.status === 'uploading' ? (
              <Loader2 size={12} className="text-blue-500 animate-spin" />
            ) : (
              <AlertCircle size={12} className="text-red-500" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate">{u.file.name}</span>
          </div>
        ))}

        {/* Add button */}
        {canUploadMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
        )}
      </div>
    );
  }

  // Full mode: drop zone + previews
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept="image/*,.pdf,video/mp4"
        multiple
      />

      {/* Drop zone */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }
          `}
        >
          <Upload size={20} className={`${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag files here or <span className="text-blue-600 dark:text-blue-400 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Images, PDF, MP4 - max 10MB each ({maxFiles - attachments.length} remaining)
            </p>
          </div>
        </div>
      )}

      {/* Attached files grid */}
      {(attachments.length > 0 || uploading.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Completed uploads */}
          {attachments.map((a, idx) => (
            <div
              key={a.file_url}
              className="group relative inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-2 pr-3 max-w-[200px]"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                {getFileIcon(a.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{a.file_name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatFileSize(a.file_size)}</p>
              </div>
              <button
                onClick={() => handleRemove(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* In-progress uploads */}
          {uploading.map((u, idx) => (
            <div
              key={`uploading-${idx}`}
              className={`inline-flex items-center gap-2 rounded-xl p-2 pr-3 max-w-[200px] ${
                u.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                {u.status === 'uploading' ? (
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                ) : (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.file.name}</p>
                <p className={`text-[10px] ${u.status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                  {u.status === 'error' ? (u.error || 'Failed') : 'Uploading...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketAttachmentUploader;
