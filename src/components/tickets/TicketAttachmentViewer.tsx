/**
 * TicketAttachmentViewer
 * Shared component for rendering ticket attachment lists.
 * Used in both admin SupportTab and user MyTicketsTab.
 * Supports image thumbnails with lightbox, PDF/file download cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Image, FileText, Film, Download, X, ExternalLink } from 'lucide-react';
import { getAttachmentSignedUrl, formatFileSize, isImageType, type AttachmentMeta } from '@/utils/ticketAttachments';

interface TicketAttachmentViewerProps {
  attachments: AttachmentMeta[];
  compact?: boolean; // Smaller layout for inline message display
}

const TicketAttachmentViewer: React.FC<TicketAttachmentViewerProps> = ({ attachments, compact = false }) => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string>('');
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  // Resolve signed URLs for image attachments
  const resolveUrl = useCallback(async (attachment: AttachmentMeta) => {
    if (signedUrls[attachment.file_url] || loadingUrls.has(attachment.file_url)) return;

    setLoadingUrls(prev => new Set(prev).add(attachment.file_url));
    try {
      const url = await getAttachmentSignedUrl(attachment.file_url);
      setSignedUrls(prev => ({ ...prev, [attachment.file_url]: url }));
    } catch {
      // Silently fail - will show fallback icon
    } finally {
      setLoadingUrls(prev => {
        const next = new Set(prev);
        next.delete(attachment.file_url);
        return next;
      });
    }
  }, [signedUrls, loadingUrls]);

  useEffect(() => {
    attachments.forEach(a => {
      if (isImageType(a.file_type)) {
        resolveUrl(a);
      }
    });
  }, [attachments]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (attachment: AttachmentMeta) => {
    try {
      let url = signedUrls[attachment.file_url];
      if (!url) {
        url = await getAttachmentSignedUrl(attachment.file_url);
        setSignedUrls(prev => ({ ...prev, [attachment.file_url]: url }));
      }
      window.open(url, '_blank');
    } catch {
      // Could not generate download URL
    }
  };

  const handleImageClick = async (attachment: AttachmentMeta) => {
    let url = signedUrls[attachment.file_url];
    if (!url) {
      try {
        url = await getAttachmentSignedUrl(attachment.file_url);
        setSignedUrls(prev => ({ ...prev, [attachment.file_url]: url }));
      } catch {
        return;
      }
    }
    setLightboxUrl(url);
    setLightboxName(attachment.file_name);
  };

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={compact ? 14 : 16} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Film size={compact ? 14 : 16} className="text-purple-500" />;
    return <FileText size={compact ? 14 : 16} className="text-red-500" />;
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-1.5' : 'mt-2'}`}>
        {attachments.map((attachment, idx) => {
          const isImage = isImageType(attachment.file_type);
          const thumbUrl = signedUrls[attachment.file_url];

          return (
            <div
              key={`${attachment.file_url}-${idx}`}
              className={`
                group relative flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors cursor-pointer
                ${compact ? 'p-1.5 pr-2.5' : 'p-2 pr-3'}
              `}
              onClick={() => isImage ? handleImageClick(attachment) : handleDownload(attachment)}
            >
              {/* Thumbnail or icon */}
              {isImage && thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={attachment.file_name}
                  className={`rounded object-cover ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                />
              ) : (
                <div className={`flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
                  {getIcon(attachment.file_type)}
                </div>
              )}

              {/* File info */}
              <div className="min-w-0 max-w-[140px]">
                <p className={`font-medium text-gray-900 dark:text-white truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  {attachment.file_name}
                </p>
                <p className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>

              {/* Download indicator */}
              <Download
                size={compact ? 10 : 12}
                className="absolute top-1 right-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <img
              src={lightboxUrl}
              alt={lightboxName}
              className="max-w-full max-h-[85vh] mx-auto rounded-lg shadow-2xl object-contain"
            />

            {/* File name + open in new tab */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <p className="text-sm text-white/70">{lightboxName}</p>
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink size={12} />
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketAttachmentViewer;
