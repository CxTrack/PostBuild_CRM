/**
 * Profile Tab Component
 * Premium user profile settings with avatar upload and AI CoPilot context
 * Design inspired by Monday.com, GoHighLevel, Linear
 *
 * Avatar: Uploads to Supabase Storage `avatars` bucket, persists URL to `user_profiles.avatar_url`
 * Profile data: `user_profiles.full_name` + `user_profiles.profile_metadata` (JSONB)
 * Uses direct fetch() to bypass Supabase AbortController issue (see MEMORY.md)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    User, Camera, Upload, X, Check, Briefcase,
    MapPin, Phone, Mail, Linkedin, Globe,
    Calendar, Save
} from 'lucide-react';
import AvatarEditor from 'react-avatar-editor';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

// Get comprehensive timezone list from browser
const TIMEZONE_OPTIONS = (() => {
    try {
        // Modern browsers support this
        return (Intl as any).supportedValuesOf('timeZone') as string[];
    } catch {
        // Fallback for older browsers
        return [
            'America/Toronto', 'America/New_York', 'America/Chicago', 'America/Denver',
            'America/Los_Angeles', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg',
            'America/Halifax', 'America/St_Johns', 'America/Anchorage', 'Pacific/Honolulu',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
            'Europe/Amsterdam', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
            'Asia/Singapore', 'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
            'America/Sao_Paulo', 'America/Mexico_City', 'Africa/Johannesburg', 'Africa/Lagos',
        ];
    }
})();
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';

interface ProfileData {
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
    department: string;
    location: string;
    timezone: string;
    bio: string;
    linkedin: string;
    website: string;
    birthday: string;
    avatar_url: string | null;

    // AI Context Fields
    work_style: string[];
    communication_preference: string[];
    goals: string[];
    interests: string[];
    expertise: string[];
    learning_topics: string[];
}

const PROFILE_KEY = 'cxtrack_user_profile';

/** Read auth token from localStorage (bypass AbortController) */
const getAuthToken = (): string | null => {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const stored = JSON.parse(localStorage.getItem(key) || '');
                if (stored?.access_token) return stored.access_token;
            } catch { /* skip */ }
        }
    }
    return null;
};

// Default profile factory - uses auth user data when available
const createDefaultProfile = (user?: { email?: string; user_metadata?: { full_name?: string } } | null): ProfileData => {
    const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const spaceIdx = rawName.indexOf(' ');
    const firstName = spaceIdx > -1 ? rawName.slice(0, spaceIdx) : rawName;
    const lastName = spaceIdx > -1 ? rawName.slice(spaceIdx + 1) : '';
    return {
    full_name: rawName,
    first_name: firstName,
    last_name: lastName,
    email: user?.email || '',
    phone: '',
    title: '',
    department: '',
    location: '',
    timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/Toronto'; } })(),
    bio: '',
    linkedin: '',
    website: '',
    birthday: '',
    avatar_url: null,
    work_style: [],
    communication_preference: [],
    goals: [],
    interests: [],
    expertise: [],
    learning_topics: []
}; };

export const ProfileTab: React.FC = () => {
    const { user: authUser } = useAuthContext();
    const effectiveUser = useEffectiveUser();
    const isImpersonated = effectiveUser.isImpersonated;
    const { fetchTeamMembers } = useOrganizationStore();
    const [profile, setProfile] = useState<ProfileData>(() => createDefaultProfile(authUser));
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [scale, setScale] = useState(1.2);
    const [saving, setSaving] = useState(false);
    const [loadedFromDb, setLoadedFromDb] = useState(false);
    const [deptOtherMode, setDeptOtherMode] = useState(false);
    const editorRef = useRef<AvatarEditor | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingAvatarBlob = useRef<Blob | null>(null);
    const pendingAvatarRemoved = useRef(false);
    const userHasEdited = useRef(false);

    // Load profile — show localStorage cache instantly, then fetch DB in background
    // Uses effectiveUser so impersonation loads the target user's profile
    useEffect(() => {
        const userId = effectiveUser.id;
        const userEmail = effectiveUser.email;

        if (!userId) return;

        // 1) Instant: load from localStorage cache (skip during impersonation — cache is admin's)
        if (!isImpersonated) {
            const saved = localStorage.getItem(PROFILE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (userEmail && parsed.email === userEmail) {
                        // Migrate old profiles: split full_name into first/last if not present
                        if (!parsed.first_name && !parsed.last_name && parsed.full_name) {
                            const spaceIdx = parsed.full_name.indexOf(' ');
                            parsed.first_name = spaceIdx > -1 ? parsed.full_name.slice(0, spaceIdx) : parsed.full_name;
                            parsed.last_name = spaceIdx > -1 ? parsed.full_name.slice(spaceIdx + 1) : '';
                        }
                        setProfile(parsed);
                        if (parsed.avatar_url) {
                            setAvatarPreview(parsed.avatar_url);
                        }
                    }
                } catch (e) {
                    // Error handled silently
                }
            } else {
                setProfile(createDefaultProfile(authUser));
            }
        } else {
            // During impersonation, seed with effective user's basic info
            setProfile(prev => ({
                ...prev,
                full_name: effectiveUser.fullName,
                first_name: effectiveUser.fullName.split(' ')[0] || '',
                last_name: effectiveUser.fullName.split(' ').slice(1).join(' ') || '',
                email: effectiveUser.email,
                avatar_url: effectiveUser.avatarUrl || null,
            }));
            if (effectiveUser.avatarUrl) {
                setAvatarPreview(effectiveUser.avatarUrl);
            }
        }

        // 2) Background: fetch from user_profiles DB (for effective user)
        userHasEdited.current = false;
        fetchProfileFromDb(userId);
    }, [effectiveUser.id, effectiveUser.email, isImpersonated]);

    /** Fetch profile from user_profiles table (direct fetch to bypass AbortController) */
    const fetchProfileFromDb = async (userId: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const res = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=full_name,avatar_url,profile_metadata`,
                {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) return;
            const rows = await res.json();
            if (!rows || rows.length === 0) return;

            const dbProfile = rows[0];
            const meta = dbProfile.profile_metadata || {};

            // Merge DB data into state
            const fullName = dbProfile.full_name || '';
            const spaceIdx = fullName.indexOf(' ');
            const firstName = meta.first_name || (spaceIdx > -1 ? fullName.slice(0, spaceIdx) : fullName);
            const lastName = meta.last_name || (spaceIdx > -1 ? fullName.slice(spaceIdx + 1) : '');

            const merged: ProfileData = {
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                email: effectiveUser.email || '',
                phone: meta.phone || '',
                title: meta.title || '',
                department: meta.department || '',
                location: meta.location || '',
                timezone: meta.timezone || (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/Toronto'; } })(),
                bio: meta.bio || '',
                linkedin: meta.linkedin || '',
                website: meta.website || '',
                birthday: meta.birthday || '',
                avatar_url: dbProfile.avatar_url || null,
                work_style: meta.work_style || [],
                communication_preference: meta.communication_preference || [],
                goals: meta.goals || [],
                interests: meta.interests || [],
                expertise: meta.expertise || [],
                learning_topics: meta.learning_topics || [],
            };

            // Skip overwriting state if user already started editing (race condition guard)
            if (userHasEdited.current) {
                console.log('[ProfileTab] Skipping DB overwrite — user has pending edits');
                setLoadedFromDb(true);
                return;
            }

            setProfile(merged);
            if (merged.avatar_url) {
                setAvatarPreview(merged.avatar_url);
            }
            // Check if loaded department is a custom (non-preset) value
            const DEPT_PRESETS = [
                'Sales', 'Marketing', 'Operations', 'Finance', 'Accounting',
                'Human Resources', 'Engineering', 'Product', 'Design',
                'Customer Success', 'Customer Support', 'Legal',
                'IT', 'Administration', 'Executive', 'Business Development',
                'Research & Development', 'Quality Assurance', 'Logistics',
                'Procurement', 'Project Management',
            ];
            if (merged.department && !DEPT_PRESETS.includes(merged.department)) {
                setDeptOtherMode(true);
            }
            setLoadedFromDb(true);

            // Update localStorage cache
            localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
        } catch (error) {
            console.error('[ProfileTab] Error fetching profile from DB:', error);
        }
    };

    /** Crop handler — immediately upload to Supabase Storage for persistence */
    const handleAvatarUpload = async () => {
        if (!editorRef.current || !authUser?.id) return;

        const canvas = editorRef.current.getImageScaledToCanvas();

        // Data URL for instant preview
        const dataUrl = canvas.toDataURL('image/png');
        setAvatarPreview(dataUrl);
        setShowCropper(false);

        // Convert to blob and upload immediately
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            try {
                const token = getAuthToken();
                if (!token) throw new Error('No auth token');

                const filePath = `${authUser.id}/avatar.png`;

                // Upload to Supabase Storage immediately
                const uploadRes = await fetch(
                    `${supabaseUrl}/storage/v1/object/avatars/${filePath}`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${token}`,
                            'x-upsert': 'true',
                            'Content-Type': 'image/png',
                        },
                        body: blob,
                    }
                );

                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    console.error('[ProfileTab] Avatar upload failed:', uploadRes.status, errText);
                    toast.error(`Avatar upload failed: ${uploadRes.status}`);
                    return;
                }

                // Build public URL with cache-bust
                const avatarPublicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}?t=${Date.now()}`;

                // Persist URL to user_profiles immediately
                const patchRes = await fetch(
                    `${supabaseUrl}/rest/v1/user_profiles?id=eq.${authUser.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation',
                        },
                        body: JSON.stringify({ avatar_url: avatarPublicUrl }),
                    }
                );

                if (!patchRes.ok) {
                    const errText = await patchRes.text();
                    console.error('[ProfileTab] Avatar URL save failed:', patchRes.status, errText);
                    toast.error(`Failed to save avatar URL: ${patchRes.status}`);
                    return;
                }

                // Validate the row was actually updated
                const avatarRows = await patchRes.json();
                if (!Array.isArray(avatarRows) || avatarRows.length === 0) {
                    console.error('[ProfileTab] Avatar PATCH returned 0 rows');
                    toast.error('Failed to save avatar. Please refresh and try again.');
                    return;
                }

                // Update local state with persisted public URL (not data URL)
                setAvatarPreview(avatarPublicUrl);
                setProfile(prev => ({ ...prev, avatar_url: avatarPublicUrl }));

                // Update localStorage cache
                const cached = localStorage.getItem(PROFILE_KEY);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        parsed.avatar_url = avatarPublicUrl;
                        localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
                    } catch { /* skip */ }
                }

                // Clear pending refs
                pendingAvatarBlob.current = null;
                pendingAvatarRemoved.current = false;

                // Refresh team members so sidebar picks up new avatar
                try { await fetchTeamMembers(); } catch { /* non-critical */ }

                toast.success('Photo saved!');
            } catch (error) {
                console.error('[ProfileTab] Avatar upload error:', error);
                toast.error(error instanceof Error ? error.message : 'Avatar upload failed');
            }
        }, 'image/png');
    };

    /** Remove avatar handler — immediately removes from Storage + DB (matches upload behavior) */
    const handleRemoveAvatar = async () => {
        if (!authUser?.id) return;

        // Immediately clear UI
        setAvatarPreview(null);
        setProfile(prev => ({ ...prev, avatar_url: null }));
        pendingAvatarBlob.current = null;
        pendingAvatarRemoved.current = false; // handled immediately, no need to defer to save

        try {
            const token = getAuthToken();
            if (!token) throw new Error('No auth token');

            // Delete from Supabase Storage
            const filePath = `${authUser.id}/avatar.png`;
            await fetch(
                `${supabaseUrl}/storage/v1/object/avatars/${filePath}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            // Clear avatar_url in user_profiles
            const patchRes = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${authUser.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                    },
                    body: JSON.stringify({ avatar_url: null }),
                }
            );

            if (!patchRes.ok) {
                throw new Error(`Failed to remove avatar (${patchRes.status})`);
            }

            const rows = await patchRes.json();
            if (!Array.isArray(rows) || rows.length === 0) {
                throw new Error('Avatar removal failed: no rows affected');
            }

            // Update localStorage cache
            const cached = localStorage.getItem(PROFILE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    parsed.avatar_url = null;
                    localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
                } catch { /* skip */ }
            }

            // Refresh team members
            try { await fetchTeamMembers(); } catch { /* non-critical */ }

            toast.success('Photo removed!');
        } catch (error) {
            console.error('[ProfileTab] Avatar removal error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to remove avatar');
        }
    };

    /** Save profile — persist all fields to user_profiles (avatar is uploaded separately on crop) */
    const handleSaveProfile = async () => {
        if (isImpersonated) {
            toast.error('Cannot edit profile while impersonating');
            return;
        }
        if (!authUser?.id) {
            toast.error('Not authenticated');
            return;
        }

        setSaving(true);

        try {
            const token = getAuthToken();
            if (!token) throw new Error('No auth token found');

            // Avatar URL: use current profile value (already persisted by handleAvatarUpload/handleRemoveAvatar)
            // Never persist data: URLs — those are transient previews
            const avatarPublicUrl: string | null = profile.avatar_url?.startsWith('data:') ? null : (profile.avatar_url || null);

            // Build profile_metadata JSONB
            const profileMetadata = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                title: profile.title,
                department: profile.department,
                location: profile.location,
                timezone: profile.timezone,
                bio: profile.bio,
                linkedin: profile.linkedin,
                website: profile.website,
                birthday: profile.birthday,
                work_style: profile.work_style,
                communication_preference: profile.communication_preference,
                goals: profile.goals,
                interests: profile.interests,
                expertise: profile.expertise,
                learning_topics: profile.learning_topics,
            };

            // PATCH user_profiles via direct fetch (bypass AbortController)
            const patchBody = {
                full_name: `${profile.first_name} ${profile.last_name}`.trim(),
                avatar_url: avatarPublicUrl,
                profile_metadata: profileMetadata,
            };
            console.log('[ProfileTab] Saving profile:', { userId: authUser.id, avatar_url: avatarPublicUrl, metadataKeys: Object.keys(profileMetadata) });

            const res = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${authUser.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                    },
                    body: JSON.stringify(patchBody),
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                console.error('[ProfileTab] Profile PATCH failed:', res.status, errText);
                throw new Error(`Profile update failed (${res.status}): ${errText}`);
            }

            // Validate that the row was actually updated (return=representation returns the updated row)
            const updatedRows = await res.json();
            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                console.error('[ProfileTab] PATCH returned 0 rows — RLS may have blocked the update');
                throw new Error('Profile update failed: no rows affected. Please refresh and try again.');
            }
            console.log('[ProfileTab] Profile saved successfully:', { metadataKeys: Object.keys(updatedRows[0]?.profile_metadata || {}) });

            // 4) Update local state with the persisted public URL
            const updatedProfile = {
                ...profile,
                full_name: `${profile.first_name} ${profile.last_name}`.trim(),
                avatar_url: avatarPublicUrl,
            };
            setProfile(updatedProfile);
            setAvatarPreview(avatarPublicUrl);

            // 5) Update localStorage cache
            localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

            // 6) Refresh team members so sidebar picks up new avatar
            try {
                await fetchTeamMembers();
            } catch { /* non-critical */ }

            // Reset edit tracking after successful save
            userHasEdited.current = false;
            toast.success('Profile saved successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save profile';
            console.error('[ProfileTab] Save error:', error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">

            {/* Impersonation read-only banner */}
            {isImpersonated && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                        Viewing {effectiveUser.fullName}'s profile (read-only while impersonating)
                    </span>
                </div>
            )}

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Profile Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Avatar Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Profile Picture
                </h3>

                <div className="flex items-start gap-8">
                    {/* Current Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (profile.first_name?.charAt(0)?.toUpperCase() || '') + (profile.last_name?.charAt(0)?.toUpperCase() || '') || 'U'
                            )}
                        </div>

                        {/* Camera Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                        >
                            <Camera className="w-5 h-5" />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                        toast.error('Image must be under 2MB');
                                        return;
                                    }
                                    setAvatar(URL.createObjectURL(file));
                                    setShowCropper(true);
                                }
                            }}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Instructions */}
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Upload a new photo
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Your photo helps team members recognize you. Max 2MB, recommended 400x400px.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Photo
                            </button>
                            {avatarPreview && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Cropper Modal */}
            {showCropper && avatar && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Crop Your Photo
                        </h3>

                        <div className="flex justify-center mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <AvatarEditor
                                ref={editorRef}
                                image={avatar}
                                width={250}
                                height={250}
                                border={30}
                                borderRadius={125}
                                color={[0, 0, 0, 0.6]}
                                scale={scale}
                                rotate={0}
                            />
                        </div>

                        {/* Scale Slider */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Zoom
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAvatarUpload}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <Check className="w-5 h-5" />
                                Save Photo
                            </button>
                            <button
                                onClick={() => setShowCropper(false)}
                                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={profile.first_name}
                            onChange={(e) => { userHasEdited.current = true; const val = e.target.value; setProfile(prev => ({ ...prev, first_name: val, full_name: `${val} ${prev.last_name}`.trim() })); }}
                            placeholder="John"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={profile.last_name}
                            onChange={(e) => { userHasEdited.current = true; const val = e.target.value; setProfile(prev => ({ ...prev, last_name: val, full_name: `${prev.first_name} ${val}`.trim() })); }}
                            placeholder="Doe"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, email: e.target.value })); }}
                                placeholder="john@example.com"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                        </label>
                        <PhoneInput
                            value={profile.phone}
                            onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, phone: e.target.value })); }}
                            className="py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Title
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                            <input
                                type="text"
                                value={profile.title}
                                onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, title: e.target.value })); }}
                                placeholder="Sales Manager"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Department
                        </label>
                        {(() => {
                            const DEPARTMENTS = [
                                'Sales', 'Marketing', 'Operations', 'Finance', 'Accounting',
                                'Human Resources', 'Engineering', 'Product', 'Design',
                                'Customer Success', 'Customer Support', 'Legal',
                                'IT', 'Administration', 'Executive', 'Business Development',
                                'Research & Development', 'Quality Assurance', 'Logistics',
                                'Procurement', 'Project Management',
                            ];
                            const currentVal = profile.department || '';
                            const isPreset = DEPARTMENTS.includes(currentVal);
                            return (
                                <div className="space-y-2">
                                    <select
                                        value={deptOtherMode ? '__other__' : (isPreset ? currentVal : '')}
                                        onChange={(e) => {
                                            userHasEdited.current = true;
                                            if (e.target.value === '__other__') {
                                                setDeptOtherMode(true);
                                                setProfile(prev => ({ ...prev, department: '' }));
                                                setTimeout(() => {
                                                    document.getElementById('department-other-input')?.focus();
                                                }, 50);
                                            } else {
                                                setDeptOtherMode(false);
                                                setProfile(prev => ({ ...prev, department: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select department...</option>
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                        <option value="__other__">Other</option>
                                    </select>
                                    {deptOtherMode && (
                                        <input
                                            id="department-other-input"
                                            type="text"
                                            value={currentVal}
                                            onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, department: e.target.value })); }}
                                            placeholder="Enter department name..."
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                        </label>
                        <AddressAutocomplete
                            value={profile.location}
                            onChange={(value) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, location: value })); }}
                            onAddressSelect={(components: AddressComponents) => {
                                userHasEdited.current = true;
                                const parts = [components.city, components.state, components.country].filter(Boolean);
                                setProfile(prev => ({ ...prev, location: parts.join(', ') }));
                            }}
                            placeholder="Start typing your city..."
                            searchTypes={['(cities)']}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Timezone
                        </label>
                        <select
                            value={profile.timezone}
                            onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, timezone: e.target.value })); }}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            {TIMEZONE_OPTIONS.map(tz => (
                                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Birthday
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                            <input
                                type="date"
                                value={profile.birthday}
                                onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, birthday: e.target.value })); }}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                    </label>
                    <textarea
                        value={profile.bio}
                        onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, bio: e.target.value.slice(0, 500) })); }}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {profile.bio.length}/500 characters
                    </p>
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Social Links
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            LinkedIn
                        </label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                            <input
                                type="url"
                                value={profile.linkedin}
                                onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, linkedin: e.target.value })); }}
                                placeholder="linkedin.com/in/johndoe"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Website
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                            <input
                                type="url"
                                value={profile.website}
                                onChange={(e) => { userHasEdited.current = true; setProfile(prev => ({ ...prev, website: e.target.value })); }}
                                placeholder="johndoe.com"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pb-8">
                <button
                    onClick={() => setProfile(createDefaultProfile(authUser))}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveProfile}
                    disabled={saving || isImpersonated}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProfileTab;
