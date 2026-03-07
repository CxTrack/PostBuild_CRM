import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, Film, Image, Music, File, Trash2, Download, Search } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import type { ConversationDocument } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface ConversationDocumentsProps {
    conversationId: string;
}

function getAuthToken(): string | null {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const stored = JSON.parse(localStorage.getItem(key) || '');
                if (stored?.access_token) return stored.access_token;
            } catch { /* ignore */ }
        }
    }
    return null;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
    if (fileType.startsWith('video/')) return <Film size={20} className="text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText size={20} className="text-red-500" />;
    return <File size={20} className="text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ConversationDocuments: React.FC<ConversationDocumentsProps> = ({ conversationId }) => {
    const [documents, setDocuments] = useState<ConversationDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { currentOrganization } = useOrganizationStore();
    const { user } = useAuthContext();

    const fetchDocuments = useCallback(async () => {
        const token = getAuthToken();
        if (!token || !conversationId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_documents?conversation_id=eq.${conversationId}&select=*,uploader:user_profiles(full_name)&order=created_at.desc`,
                { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
            );
            if (res.ok) {
                setDocuments(await res.json());
            }
        } catch (err) {
            console.error('[ConversationDocuments] fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (file: File) => {
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !orgId || !user?.id) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop() || 'bin';
            const storagePath = `${orgId}/${conversationId}/docs/${crypto.randomUUID()}.${fileExt}`;

            // Upload to storage
            const formData = new FormData();
            formData.append('', file);
            const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/chat-attachments/${storagePath}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
                body: formData,
            });

            if (!uploadRes.ok) {
                throw new Error('Upload to storage failed');
            }

            // Insert document record
            const res = await fetch(`${supabaseUrl}/rest/v1/conversation_documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    uploaded_by: user.id,
                    file_name: file.name,
                    file_type: file.type || 'application/octet-stream',
                    file_size: file.size,
                    storage_path: storagePath,
                }),
            });

            if (res.ok) {
                const [doc] = await res.json();
                // Attach uploader info for display
                doc.uploader = { full_name: user.user_metadata?.full_name || 'You' };
                setDocuments(prev => [doc, ...prev]);
                toast.success(`"${file.name}" uploaded`);
            } else {
                throw new Error('Failed to save document record');
            }
        } catch (err) {
            console.error('[ConversationDocuments] upload error:', err);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: ConversationDocument) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            // Get signed URL
            const signRes = await fetch(`${supabaseUrl}/storage/v1/object/sign/chat-attachments/${doc.storage_path}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expiresIn: 3600 }),
            });

            if (signRes.ok) {
                const data = await signRes.json();
                const url = data.signedURL
                    ? `${supabaseUrl}/storage/v1${data.signedURL}`
                    : `${supabaseUrl}/storage/v1/object/chat-attachments/${doc.storage_path}`;
                window.open(url, '_blank');
            } else {
                toast.error('Failed to generate download link');
            }
        } catch {
            toast.error('Failed to download file');
        }
    };

    const handleDelete = async (doc: ConversationDocument) => {
        if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            // Delete from storage
            await fetch(`${supabaseUrl}/storage/v1/object/chat-attachments/${doc.storage_path}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
            });

            // Delete record
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_documents?id=eq.${doc.id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Prefer': 'return=minimal' },
                }
            );

            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                toast.success('File deleted');
            }
        } catch {
            toast.error('Failed to delete file');
        }
    };

    const canDelete = (doc: ConversationDocument) => {
        return doc.uploaded_by === user?.id;
    };

    const filteredDocs = documents.filter(doc => {
        if (!searchQuery.trim()) return true;
        return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-1.5">
                    <Search size={14} className="text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="bg-transparent flex-1 outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { handleUpload(file); e.target.value = ''; }
                    }}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Upload size={14} />
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center text-sm text-gray-500 py-8">Loading files...</div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText size={28} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {searchQuery ? 'No files match your search' : 'No files shared yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {searchQuery ? 'Try a different search term' : 'Upload files to share with conversation members'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {filteredDocs.map(doc => (
                            <div
                                key={doc.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 group transition-colors"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                    {getFileIcon(doc.file_type)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {doc.file_name}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        {formatFileSize(doc.file_size)} &middot; {doc.uploader?.full_name || 'Unknown'} &middot; {formatDate(doc.created_at)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </button>
                                    {canDelete(doc) && (
                                        <button
                                            onClick={() => handleDelete(doc)}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer stats */}
            {documents.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50 text-[11px] text-gray-500">
                    {documents.length} file{documents.length !== 1 ? 's' : ''} &middot; {formatFileSize(documents.reduce((sum, d) => sum + d.file_size, 0))} total
                </div>
            )}
        </div>
    );
};

export default ConversationDocuments;
