import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Play, Pause, Clock,
  FileText, ChevronDown, ChevronUp, Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import type { Call } from '@/types/database.types';

interface RecentCallsSectionProps {
  customerId: string;
}

const RecentCallsSection: React.FC<RecentCallsSectionProps> = ({ customerId }) => {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationStore();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!customerId || !currentOrganization?.id) return;

    const fetchCalls = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setCalls(data || []);
      } catch (err) {
        console.error('Failed to fetch calls:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [customerId, currentOrganization?.id]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const toggleAudio = (call: Call) => {
    if (!call.recording_url) return;

    if (playingCallId === call.id) {
      audioRef.current?.pause();
      setPlayingCallId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = call.recording_url;
        audioRef.current.play();
        setPlayingCallId(call.id);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
      case 'failed': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      case 'no_answer': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <Phone size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Calls
          </h2>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingCallId(null)} className="hidden" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-8">
          <Phone size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No calls recorded</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Calls will appear here when logged</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calls.map((call) => {
            const isExpanded = expandedCallId === call.id;
            const isPlaying = playingCallId === call.id;
            const DirectionIcon = call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing;

            return (
              <div
                key={call.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
              >
                {/* Call row */}
                <div
                  onClick={() => toggleExpand(call.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${call.direction === 'inbound'
                      ? 'bg-blue-50 dark:bg-blue-500/10'
                      : 'bg-green-50 dark:bg-green-500/10'
                    }`}>
                      <DirectionIcon size={14} className={call.direction === 'inbound'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-green-600 dark:text-green-400'
                      } />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(call.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      {formatDuration(call.duration_seconds)}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(call.status)}`}>
                      {call.status.replace('_', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    {/* Audio player */}
                    {call.recording_url && (
                      <div className="flex items-center gap-3 pt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAudio(call); }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <div className="flex items-center gap-2">
                          <Volume2 size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{isPlaying ? 'Playing...' : 'Play recording'}</span>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {call.call_summary && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <FileText size={12} /> Summary
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {call.call_summary}
                        </p>
                      </div>
                    )}

                    {/* Transcript snippet */}
                    {call.transcript && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Transcript</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                          {call.transcript}
                        </p>
                      </div>
                    )}

                    {/* View full detail link */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/calls/${call.id}`); }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      View Full Details →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentCallsSection;
