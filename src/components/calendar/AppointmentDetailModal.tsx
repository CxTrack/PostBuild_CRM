import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  X,
  Edit3,
  Eye,
  FileText,
  Upload,
  Phone,
  Mail,
  Clock,
  User,
  Calendar,
  Sparkles,
  MapPin,
  Video,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Info,
  Trash2,
  Download,
  File,
  Loader2,
} from 'lucide-react';
import { CalendarEvent, EventStatus } from '@/types/database.types';
import { FEATURE_FLAGS } from '@/config/features.config';
import { useDocumentStore, type CustomerDocument } from '@/stores/documentStore';
import TimePicker from '../shared/TimePicker';
import DurationPicker from '../shared/DurationPicker';
import { convert24HourTo12Hour } from '@/utils/time.utils';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import toast from 'react-hot-toast';

interface AppointmentDetailModalProps {
  appointment: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  customerName?: string;
}

export default function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onUpdate,
  customerName,
}: AppointmentDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);

  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  const [editFormData, setEditFormData] = useState({
    title: appointment.title,
    description: appointment.description || '',
    event_type: appointment.event_type,
    status: appointment.status,
    date: format(startDate, 'yyyy-MM-dd'),
    start_time: convert24HourTo12Hour(format(startDate, 'HH:mm')),
    duration: durationMinutes,
    location: appointment.location || '',
    meeting_url: appointment.meeting_url || '',
  });

  // AI CoPilot state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAiContext = useCallback(async () => {
    if (!FEATURE_FLAGS.AI_COPILOT_ENABLED || !FEATURE_FLAGS.AI_APPOINTMENT_CONTEXT) return;
    if (!appointment.customer_id) return;

    setAiLoading(true);
    setAiError(null);

    const token = await getAuthToken();
    if (!token) {
      setAiError('Please sign in to view AI insights');
      setAiLoading(false);
      return;
    }

    try {
      const appointmentDate = format(new Date(appointment.start_time), 'MMM dd, yyyy h:mm a');
      const response = await fetch(`${getSupabaseUrl()}/functions/v1/copilot-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `I have an upcoming ${appointment.event_type} "${appointment.title}" scheduled for ${appointmentDate}${customerName ? ` with ${customerName}` : ''}. Based on the CRM data for this customer (ID: ${appointment.customer_id}), provide a brief meeting preparation summary including: relationship overview, key points to remember, and recent activity highlights. ONLY report what appears in the retrieved data — do NOT invent or assume any information. Keep it concise.`,
          conversationHistory: [],
          context: {
            page: 'Customers',
            customer_id: appointment.customer_id,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.error === 'token_limit_reached') {
          setAiError('Out of AI tokens this month');
          return;
        }
        throw new Error(data.error || 'Could not generate insights');
      }

      const data = await response.json();
      if (data.response) {
        setAiSummary(data.response);
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not generate insights');
    } finally {
      setAiLoading(false);
    }
  }, [appointment.customer_id, appointment.title, appointment.event_type, appointment.start_time, customerName]);

  useEffect(() => {
    fetchAiContext();
  }, [fetchAiContext]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const [time, period] = editFormData.start_time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;

      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }

      const [year, month, day] = editFormData.date.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, hour24, minutes, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + editFormData.duration * 60000);

      await onUpdate(appointment.id, {
        title: editFormData.title,
        description: editFormData.description,
        event_type: editFormData.event_type,
        status: editFormData.status,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: editFormData.location,
        meeting_url: editFormData.meeting_url,
      });

      toast.success('Appointment updated successfully');
      setMode('view');
    } catch (error) {
      toast.error('Failed to update appointment');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appointment Details</h2>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Eye size={16} />
                View
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'edit'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Edit3 size={16} />
                Edit
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'view' ? (
            <ViewMode
              appointment={appointment}
              aiSummary={aiSummary}
              aiLoading={aiLoading}
              aiError={aiError}
              onRefreshAi={fetchAiContext}
              customerName={customerName}
            />
          ) : (
            <EditMode
              appointment={appointment}
              formData={editFormData}
              setFormData={setEditFormData}
              onSave={handleSave}
              onCancel={() => setMode('view')}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ViewMode({
  appointment,
  aiSummary,
  aiLoading,
  aiError,
  onRefreshAi,
  customerName,
}: {
  appointment: CalendarEvent;
  aiSummary: string | null;
  aiLoading: boolean;
  aiError: string | null;
  onRefreshAi: () => void;
  customerName?: string;
}) {
  const { documents, loading: docsLoading, fetchDocuments, uploadDocument, deleteDocument, getDownloadUrl } = useDocumentStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (appointment.customer_id) {
      fetchDocuments(appointment.customer_id);
    }
  }, [appointment.customer_id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appointment.customer_id) return;

    setUploading(true);
    try {
      await uploadDocument(appointment.customer_id, file, 'appointment');
      toast.success('File uploaded successfully');
      fetchDocuments(appointment.customer_id);
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: CustomerDocument) => {
    const url = await getDownloadUrl(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Failed to get download link');
    }
  };

  const handleDeleteDoc = async (doc: CustomerDocument) => {
    try {
      await deleteDocument(doc.id, doc.file_path);
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{appointment.title}</h3>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
              <Calendar size={14} />
              {appointment.event_type}
            </span>

            <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(appointment.status)}`}>
              <CheckCircle size={14} />
              {appointment.status}
            </span>

            <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium">
              <Clock size={14} />
              {durationMinutes} min
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        {customerName && (
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Customer:</span>
            <span className="font-medium text-gray-900 dark:text-white">{customerName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Date:</span>
          <span className="font-medium text-gray-900 dark:text-white">{format(startDate, 'MMM dd, yyyy')}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Time:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </span>
        </div>

        {appointment.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Location:</span>
            <span className="font-medium text-gray-900 dark:text-white">{appointment.location}</span>
          </div>
        )}

        {appointment.meeting_url && (
          <div className="flex items-center gap-2 text-sm col-span-2">
            <Video size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Meeting URL:</span>
            <a
              href={appointment.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>

      {/* AI CoPilot Section */}
      {FEATURE_FLAGS.AI_COPILOT_ENABLED && FEATURE_FLAGS.AI_APPOINTMENT_CONTEXT && appointment.customer_id && (
        <div className="p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">CxTrack Copilot</h4>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium">
                AI-Powered
              </span>
            </div>
            <button
              onClick={onRefreshAi}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
            >
              <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {aiLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded animate-pulse w-full" />
              <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded animate-pulse w-4/6" />
            </div>
          ) : aiError ? (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
            </div>
          ) : aiSummary ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {aiSummary}
            </p>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
              <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI insights will appear once there is customer activity data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <FileText size={16} />
          Description
        </h4>
        {appointment.description ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {appointment.description}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No description added yet</p>
        )}
      </div>

      {/* Documentation / File Upload */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Upload size={16} />
          Documentation
        </h4>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Show uploaded documents */}
        {appointment.customer_id && documents.length > 0 && (
          <div className="space-y-2 mb-4">
            {documents.filter(d => d.category === 'appointment' || d.category === 'general').map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <File size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={14} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {appointment.customer_id ? (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="mx-auto text-primary-500 mb-2 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {documents.filter(d => d.category === 'appointment' || d.category === 'general').length > 0
                    ? 'Upload more files'
                    : 'No files uploaded yet'}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Upload files
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
            <Info size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Link a customer to this appointment to upload documents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditMode({
  appointment,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
}: {
  appointment: CalendarEvent;
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="p-6 space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
          <select
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="appointment">Appointment</option>
            <option value="meeting">Meeting</option>
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <TimePicker
        selectedTime={formData.start_time}
        onTimeChange={(time) => setFormData({ ...formData, start_time: time })}
        label="Start Time"
        required={true}
      />

      <DurationPicker
        duration={formData.duration}
        onDurationChange={(duration) => setFormData({ ...formData, duration })}
        label="Duration"
        required={true}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Meeting location"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meeting URL</label>
        <input
          type="url"
          value={formData.meeting_url}
          onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://meet.google.com/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Add description about this appointment..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
