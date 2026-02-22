import React, { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Video,
  Flag,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Task, TaskType, TaskPriority, TaskStatus } from '@/stores/taskStore';
import { FEATURE_FLAGS } from '@/config/features.config';
import TimePicker from '../shared/TimePicker';
import DurationPicker from '../shared/DurationPicker';
import { calculateEndTime, formatDateTimeRange } from '@/utils/time.utils';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
}

export default function TaskDetailModal({ task, isOpen, onClose, onUpdate }: TaskDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({
    title: task.title,
    description: task.description || '',
    type: task.type,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date,
    start_time: task.start_time || '',
    duration: task.duration || 30,
    show_on_calendar: task.show_on_calendar || false,
  });

  // AI CoPilot state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAiContext = useCallback(async () => {
    if (!FEATURE_FLAGS.AI_COPILOT_ENABLED || !FEATURE_FLAGS.AI_TASK_CONTEXT) return;
    if (!task.customer_id) return;

    setAiLoading(true);
    setAiError(null);

    const token = await getAuthToken();
    if (!token) {
      setAiError('Please sign in to view AI insights');
      setAiLoading(false);
      return;
    }

    try {
      const dueDate = format(new Date(task.due_date), 'MMM dd, yyyy');
      const response = await fetch(`${getSupabaseUrl()}/functions/v1/copilot-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `I have a ${task.type} task "${task.title}" due ${dueDate}${task.customer_name ? ` for customer ${task.customer_name}` : ''}. Based on the CRM data for this customer (ID: ${task.customer_id}), provide a brief task preparation summary including: relationship overview, key points to remember, and recent activity highlights. ONLY report what appears in the retrieved data — do NOT invent or assume any information. Keep it concise.`,
          conversationHistory: [],
          context: {
            page: 'Customers',
            customer_id: task.customer_id,
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
  }, [task.customer_id, task.title, task.type, task.due_date, task.customer_name]);

  useEffect(() => {
    fetchAiContext();
  }, [fetchAiContext]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const endTime = editFormData.show_on_calendar && editFormData.start_time
        ? calculateEndTime(editFormData.start_time, editFormData.duration)
        : undefined;

      await onUpdate(task.id, {
        ...editFormData,
        end_time: endTime,
      });

      toast.success('Task updated successfully');
      setMode('view');
    } catch (error) {
      toast.error('Failed to update task');
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Details</h2>

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
              task={task}
              aiSummary={aiSummary}
              aiLoading={aiLoading}
              aiError={aiError}
              onRefreshAi={fetchAiContext}
            />
          ) : (
            <EditMode
              task={task}
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
  task,
  aiSummary,
  aiLoading,
  aiError,
  onRefreshAi,
}: {
  task: Task;
  aiSummary: string | null;
  aiLoading: boolean;
  aiError: string | null;
  onRefreshAi: () => void;
}) {
  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'call':
        return <Phone size={14} />;
      case 'email':
        return <Mail size={14} />;
      case 'sms':
        return <MessageSquare size={14} />;
      case 'meeting':
        return <Video size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400`}
            >
              {getTypeIcon(task.type)}
              {task.type}
            </span>

            <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getPriorityColor(task.priority)}`}>
              <Flag size={14} />
              {task.priority}
            </span>

            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>

            {task.show_on_calendar && (
              <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium">
                <Calendar size={14} />
                On Calendar
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <User size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Customer:</span>
          <span className="font-medium text-gray-900 dark:text-white">{task.customer_name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
          <span className="font-medium text-gray-900 dark:text-white">{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
        </div>

        {task.show_on_calendar && task.start_time && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {task.start_time} - {task.end_time}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">{task.duration} min</span>
            </div>
          </>
        )}
      </div>

      {/* AI CoPilot Section */}
      {FEATURE_FLAGS.AI_COPILOT_ENABLED && FEATURE_FLAGS.AI_TASK_CONTEXT && task.customer_id && (
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

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <FileText size={16} />
          Notes
        </h4>
        {task.description ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {task.description}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No notes added yet</p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Upload size={16} />
          Documentation
        </h4>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
          <Upload size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No files uploaded yet</p>
          <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Upload files
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMode({
  task,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
}: {
  task: Task;
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="follow_up">Follow Up</option>
            <option value="meeting">Meeting Prep</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority *</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-700 dark:text-gray-300" />
            <span className="font-medium text-gray-900 dark:text-white">Show on Calendar</span>
          </div>

          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                show_on_calendar: !formData.show_on_calendar,
              })
            }
            className={`relative w-14 h-7 rounded-full transition-colors ${
              formData.show_on_calendar ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                formData.show_on_calendar ? 'translate-x-7' : ''
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formData.show_on_calendar ? 'Task will block calendar time' : 'Task will only appear in task list'}
        </p>
      </div>

      {formData.show_on_calendar && (
        <>
          <TimePicker
            selectedTime={formData.start_time}
            onTimeChange={(time) => setFormData({ ...formData, start_time: time })}
            label="Start Time"
            required={false}
          />

          <DurationPicker
            duration={formData.duration}
            onDurationChange={(duration) => setFormData({ ...formData, duration })}
            label="Duration"
            required={false}
          />

          {formData.start_time && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <Clock size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                {formatDateTimeRange(
                  formData.due_date,
                  formData.start_time,
                  calculateEndTime(formData.start_time, formData.duration)
                )}
              </span>
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Add notes about this task..."
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
