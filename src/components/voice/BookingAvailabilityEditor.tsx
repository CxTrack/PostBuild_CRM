import { useState } from 'react';
import { Plus, Trash2, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import {
  type BookingAvailability,
  type TimeWindow,
  generateBookingRulesPrompt,
  TIMEZONE_OPTIONS,
  DURATION_OPTIONS,
} from '@/utils/bookingPrompt';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

// Generate time options in 30-minute increments
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m}`);
  }
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

interface BookingAvailabilityEditorProps {
  value: BookingAvailability;
  onChange: (availability: BookingAvailability) => void;
  showPreview?: boolean;
}

export default function BookingAvailabilityEditor({
  value,
  onChange,
  showPreview = true,
}: BookingAvailabilityEditorProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const updateSchedule = (day: string, windows: TimeWindow[]) => {
    onChange({
      ...value,
      schedule: { ...value.schedule, [day]: windows },
    });
  };

  const toggleDay = (day: string) => {
    const current = value.schedule[day] || [];
    if (current.length > 0) {
      updateSchedule(day, []);
    } else {
      updateSchedule(day, [{ start: '09:00', end: '17:00' }]);
    }
  };

  const addWindow = (day: string) => {
    const current = value.schedule[day] || [];
    const lastEnd = current.length > 0 ? current[current.length - 1].end : '09:00';
    const [h] = lastEnd.split(':').map(Number);
    const newStart = `${Math.min(h + 1, 23).toString().padStart(2, '0')}:00`;
    const newEnd = `${Math.min(h + 3, 23).toString().padStart(2, '0')}:00`;
    updateSchedule(day, [...current, { start: newStart, end: newEnd }]);
  };

  const removeWindow = (day: string, idx: number) => {
    const current = [...(value.schedule[day] || [])];
    current.splice(idx, 1);
    updateSchedule(day, current);
  };

  const updateWindow = (day: string, idx: number, field: 'start' | 'end', val: string) => {
    const current = [...(value.schedule[day] || [])];
    current[idx] = { ...current[idx], [field]: val };
    updateSchedule(day, current);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          When can your AI agent book meetings for you?
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          This is separate from your business hours. Set the times YOU are actually available for meetings.
          Use multiple windows if you have gaps (e.g., available before and after work).
        </p>
      </div>

      {/* Meeting Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Meeting Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title</label>
          <input
            type="text"
            value={value.meeting_title}
            onChange={(e) => onChange({ ...value, meeting_title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Consultation Call"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Duration</label>
          <select
            value={value.meeting_duration_minutes}
            onChange={(e) => onChange({ ...value, meeting_duration_minutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
          <select
            value={value.timezone}
            onChange={(e) => onChange({ ...value, timezone: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Available Days & Times</label>
        <div className="space-y-1">
          {DAY_ORDER.map((day) => {
            const windows = value.schedule[day] || [];
            const isEnabled = windows.length > 0;

            return (
              <div
                key={day}
                className={`rounded-lg border p-3 transition-colors ${
                  isEnabled
                    ? 'border-gray-700 bg-gray-800/50'
                    : 'border-gray-800 bg-gray-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      isEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>

                  {/* Day label */}
                  <span className={`text-sm font-medium w-24 ${isEnabled ? 'text-gray-100' : 'text-gray-500'}`}>
                    {DAY_LABELS[day]}
                  </span>

                  {/* Time windows */}
                  {isEnabled ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {windows.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-gray-500 text-xs mr-1">+</span>}
                          <select
                            value={w.start}
                            onChange={(e) => updateWindow(day, idx, 'start', e.target.value)}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-xs
                                       focus:ring-1 focus:ring-indigo-500"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{formatTime12h(t)}</option>
                            ))}
                          </select>
                          <span className="text-gray-500 text-xs">to</span>
                          <select
                            value={w.end}
                            onChange={(e) => updateWindow(day, idx, 'end', e.target.value)}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-xs
                                       focus:ring-1 focus:ring-indigo-500"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{formatTime12h(t)}</option>
                            ))}
                          </select>
                          {windows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWindow(day, idx)}
                              className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
                              title="Remove window"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addWindow(day)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300
                                   border border-dashed border-gray-600 rounded hover:border-indigo-500 transition-colors"
                        title="Add another time window"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">Not available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800
                       text-sm text-gray-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-400" />
              What your AI agent will know
            </span>
            {previewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {previewOpen && (
            <pre className="px-4 py-3 text-xs text-gray-400 bg-gray-900 overflow-x-auto whitespace-pre-wrap font-mono">
              {generateBookingRulesPrompt(value)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
