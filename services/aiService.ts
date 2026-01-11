import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SolutionStep {
    title: string;
    description: string;
    math?: string;
    icon: string;
    reasoning?: string;
}

export interface SolveResponse {
    topic: string;
    subtopic: string;
    explanation: string;
    steps: SolutionStep[];
    finalResult: string;
    confidence: number;
    subjectConfidence?: number;
    detectedSubject?: string;
    extractedText?: string;
    quota?: { remainingTokens: number };
}

export interface ChatResponse {
    reply: string;
    quota?: { remainingTokens: number };
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('You must be logged in to use AI features');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
    };
}

/**
 * Solve a homework problem from an image
 */
export async function solveHomework(
    imageBase64: string,
    options?: {
        mode?: string;
        difficulty?: 'easy' | 'standard' | 'challenge';
    }
): Promise<SolveResponse> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/solve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            imageBase64,
            mode: options?.mode ?? 'Homework',
            difficulty: options?.difficulty ?? 'standard',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
            throw new Error('Daily quota exceeded. Please try again tomorrow.');
        }
        if (response.status === 401) {
            throw new Error('Please log in to use AI features.');
        }
        throw new Error(error.message || 'Failed to solve homework');
    }

    return response.json();
}

/**
 * Chat with the AI tutor for follow-up questions
 */
export async function chatWithTutor(
    message: string,
    history: ChatMessage[] = [],
    context?: {
        topic?: string;
        subtopic?: string;
        solutionSummary?: string;
    }
): Promise<ChatResponse> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            message,
            history,
            context,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
            throw new Error('Daily quota exceeded. Please try again tomorrow.');
        }
        if (response.status === 401) {
            throw new Error('Please log in to use AI features.');
        }
        throw new Error(error.message || 'Chat failed');
    }

    return response.json();
}
