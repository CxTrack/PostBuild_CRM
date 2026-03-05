import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, X, CheckCircle } from 'lucide-react';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

interface FeedbackButtonsProps {
  messageId: string;
  messageContent: string;
  userMessage?: string;
  contextPage?: string;
  feedbackRating?: 'positive' | 'negative';
  onFeedbackGiven: (messageId: string, rating: 'positive' | 'negative') => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  messageId,
  messageContent,
  userMessage,
  contextPage,
  feedbackRating,
  onFeedbackGiven,
}) => {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const SUPABASE_URL = getSupabaseUrl();

  const insertFeedback = async (
    rating: 'positive' | 'negative',
    feedbackComment?: string
  ): Promise<{ feedbackId?: string; ticketId?: string }> => {
    const accessToken = await getAuthToken();
    if (!accessToken) throw new Error('Not authenticated');

    const orgId = useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) throw new Error('No organization');

    // Insert feedback row
    const feedbackRes = await fetch(`${SUPABASE_URL}/rest/v1/copilot_feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: (await getUserId(accessToken)),
        organization_id: orgId,
        message_content: messageContent.substring(0, 2000),
        user_message: userMessage?.substring(0, 1000) || null,
        rating,
        feedback_text: feedbackComment || null,
        context_page: contextPage || null,
      }),
    });

    if (!feedbackRes.ok) {
      throw new Error('Failed to save feedback');
    }

    const feedbackData = await feedbackRes.json();
    const feedbackId = feedbackData?.[0]?.id;

    // If negative, create a support ticket
    let ticketId: string | undefined;
    if (rating === 'negative') {
      const ticketRes = await fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          organization_id: orgId,
          subject: `CoPilot Feedback: ${feedbackComment?.substring(0, 80) || 'Negative response rating'}`,
          description: `**User feedback on CoPilot response**\n\n**Rating:** Negative\n**Page:** ${contextPage || 'Unknown'}\n\n**User asked:** ${userMessage || 'N/A'}\n\n**CoPilot responded:** ${messageContent.substring(0, 500)}\n\n**User feedback:** ${feedbackComment || 'No additional feedback provided'}`,
          category: 'copilot_feedback',
          source: 'copilot_feedback',
          priority: 'low',
          status: 'open',
        }),
      });

      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        ticketId = ticketData?.[0]?.id;

        // Link ticket back to feedback row
        if (feedbackId && ticketId) {
          await fetch(`${SUPABASE_URL}/rest/v1/copilot_feedback?id=eq.${feedbackId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ support_ticket_id: ticketId }),
          });
        }

        // Fire ticket notification edge function (fire and forget)
        fetch(`${SUPABASE_URL}/functions/v1/send-ticket-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            type: 'new_ticket',
          }),
        }).catch(() => {});
      }
    }

    return { feedbackId, ticketId };
  };

  const getUserId = async (accessToken: string): Promise<string> => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
    });
    const data = await res.json();
    return data.id;
  };

  const handleThumbsUp = async () => {
    if (feedbackRating) return;
    try {
      await insertFeedback('positive');
      onFeedbackGiven(messageId, 'positive');
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Failed to save feedback');
    }
  };

  const handleThumbsDown = async () => {
    if (feedbackRating) return;
    onFeedbackGiven(messageId, 'negative');
    setShowFeedbackInput(true);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      await insertFeedback('negative', feedbackText);
      setSubmitted(true);
      setShowFeedbackInput(false);
      toast.success('Thanks for your feedback');
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Failed to save feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackText('');
    // If they cancel the feedback form, reset the rating
    if (!submitted) {
      onFeedbackGiven(messageId, 'negative'); // keep negative marked but no ticket
    }
  };

  // Already submitted or rated positive
  if (feedbackRating === 'positive' || submitted) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        {feedbackRating === 'positive' ? (
          <div className="flex items-center gap-1 text-emerald-500">
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-medium">Helpful</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Feedback sent</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1.5">
      {/* Thumbs buttons */}
      {!showFeedbackInput && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleThumbsUp}
            disabled={!!feedbackRating}
            className="p-1 rounded-md transition-colors text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
            title="Helpful response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleThumbsDown}
            disabled={!!feedbackRating}
            className="p-1 rounded-md transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            title="Not helpful"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feedback input (expanded on thumbs down) */}
      {showFeedbackInput && (
        <div className="mt-2 max-w-[85%] animate-in slide-in-from-top-1 duration-200">
          <div className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              What could be better?
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="The response was inaccurate, too vague, didn't answer my question..."
              className="w-full text-xs rounded-md border px-2.5 py-2 resize-none bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCancelFeedback}
                className="text-xs px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackButtons;
