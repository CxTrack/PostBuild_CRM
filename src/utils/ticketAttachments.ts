/**
 * Ticket Attachment Utilities
 * Handles file upload/download to Supabase Storage for support ticket attachments.
 * Uses direct fetch() to avoid the Supabase AbortController issue.
 */

import { getAuthToken } from '@/utils/auth.utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const BUCKET = 'ticket-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'video/mp4',
];

export interface AttachmentMeta {
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string; // Storage path (not full URL)
}

export interface UploadProgress {
  file_name: string;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

/**
 * Validate a file before upload
 */
export function validateAttachment(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds the 10MB limit (${formatFileSize(file.size)})`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type "${file.type}" is not supported. Allowed: images, PDF, MP4`;
  }
  return null;
}

/**
 * Upload a file to the ticket-attachments bucket.
 * Files are stored at: {organizationId}/{ticketOrDraftId}/{timestamp}_{safeName}
 */
export async function uploadTicketAttachment(
  file: File,
  organizationId: string,
  ticketOrDraftId: string
): Promise<AttachmentMeta> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  // Validate
  const validationError = validateAttachment(file);
  if (validationError) throw new Error(validationError);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${organizationId}/${ticketOrDraftId}/${timestamp}_${safeName}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': token,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Upload failed');
    throw new Error(`Failed to upload ${file.name}: ${errText}`);
  }

  return {
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_url: path,
  };
}

/**
 * Get a signed URL for viewing/downloading an attachment.
 * URLs expire after 5 minutes.
 */
export async function getAttachmentSignedUrl(filePath: string): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const url = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${filePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 300 }), // 5 minutes
  });

  if (!res.ok) {
    throw new Error('Failed to generate download URL');
  }

  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

/**
 * Delete an attachment from storage (for cleanup on cancel).
 */
export async function deleteTicketAttachment(filePath: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`;
  await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': token,
    },
  }).catch(() => { /* non-blocking cleanup */ });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get a display-friendly file type label
 */
export function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('video/')) return 'Video';
  return 'File';
}

/**
 * Check if a file type is an image (for thumbnail rendering)
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
