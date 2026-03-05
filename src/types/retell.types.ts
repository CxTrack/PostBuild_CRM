export interface RetellCallData {
    call_id: string;
    agent_id: string;
    call_type: 'inbound' | 'outbound';
    call_status: 'completed' | 'ongoing' | 'failed';
    start_timestamp: number;
    end_timestamp: number;
    duration_ms: number;

    // Audio
    recording_url: string;

    // Transcript
    transcript: string;
    transcript_object: Array<{
        role: 'agent' | 'user';
        content: string;
        timestamp: number;
    }>;

    // Analysis
    sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_score: number; // -1 to 1
    key_topics: string[];
    action_items: string[];
    summary: string;

    // Metadata
    phone_number: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    metadata?: Record<string, any>;

    // Advanced
    interruptions_count: number;
    user_sentiment_flow: Array<{ timestamp: number; sentiment: number }>;
    agent_performance: {
        clarity_score: number;
        response_time_avg: number;
        successful_responses: number;
    };
}

// ── Webhook Types ──────────────────────────────────────────────────

export type RetellWebhookEvent = 'call_started' | 'call_ended' | 'call_analyzed';

export interface RetellWebhookPayload {
    event: RetellWebhookEvent;
    call: {
        call_id: string;
        agent_id: string;
        call_type?: string;
        from_number?: string;
        to_number?: string;
        direction?: string;
        metadata?: Record<string, string>;
        start_timestamp?: number;
        end_timestamp?: number;
        duration_ms?: number;
        transcript?: string;
        transcript_object?: Array<{ role: string; content: string; words?: any[] }>;
        recording_url?: string;
        public_log_url?: string;
        disconnection_reason?: string;
        call_analysis?: {
            call_summary?: string;
            user_sentiment?: string;
            custom_analysis_data?: Record<string, string>;
            call_successful?: boolean;
            in_voicemail?: boolean;
        };
        retell_llm_dynamic_variables?: Record<string, string>;
    };
}

// ── Function Calling Types ─────────────────────────────────────────

export interface RetellFunctionCallPayload {
    call_id: string;
    agent_id: string;
    name: string;
    args: Record<string, any>;
}

export interface RetellToolDefinition {
    type: 'custom';
    name: string;
    description: string;
    url: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required?: string[];
    };
    speak_during_execution?: boolean;
    speak_after_execution?: boolean;
}

// ── Memory Settings ────────────────────────────────────────────────

export interface VoiceMemorySettings {
    memory_enabled: boolean;
    memory_call_history: boolean;
    memory_customer_notes: boolean;
    memory_calendar_tasks: boolean;
}
