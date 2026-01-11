import { supabase } from './supabaseClient';
import { LinkedStudent, Solution, UserStats } from '../types';

// Profile/User functions
export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getProfile = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) console.error('Error fetching profile:', error);
    return data;
};

export const updateDifficultyLevel = async (
    userId: string,
    difficulty_level: 'easy' | 'standard' | 'challenge'
) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .update({ difficulty_level })
        .eq('id', userId)
        .select('*')
        .single();
    if (error) console.error('Error updating difficulty:', error);
    return data;
};

export const getUserStats = async (userId: string): Promise<UserStats | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('user_stats_view')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) console.error('Error fetching user stats:', error);
    return data ? {
        problemsSolved: data.problems_solved || 0,
        streak: data.streak || 0,
        accuracy: data.accuracy || 0,
        studyTime: data.study_time || '0h',
        masteredTopics: data.mastered_topics || 0
    } : null;
};

// Solution functions
export const saveSolution = async (userId: string, solution: Omit<Solution, 'id'>) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('solutions')
        .insert({
            user_id: userId,
            topic: solution.topic,
            subtopic: solution.subtopic,
            explanation: solution.explanation,
            steps: solution.steps,
            final_result: solution.finalResult,
            capture_url: solution.captureUrl,
            confidence: solution.confidence ?? null,
            detected_subject: solution.detectedSubject ?? null,
            subject_confidence: solution.subjectConfidence ?? null,
            extracted_text: solution.extractedText ?? null
        })
        .select()
        .single();
    if (error) console.error('Error saving solution:', error);
    return data;
};

export const getSolutionHistory = async (userId: string): Promise<Solution[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching solutions:', error);
        return [];
    }
    return (data || []).map(s => ({
        id: s.id,
        topic: s.topic,
        subtopic: s.subtopic,
        explanation: s.explanation,
        steps: s.steps,
        finalResult: s.final_result,
        confidence: s.confidence ?? undefined,
        detectedSubject: s.detected_subject ?? undefined,
        subjectConfidence: s.subject_confidence ?? undefined,
        extractedText: s.extracted_text ?? undefined,
        captureUrl: s.capture_url,
        timestamp: s.created_at
    }));
};

export const getQuotaStatus = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('ai_quota_status_view')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('Error fetching quota status:', error);
        return null;
    }
    return data;
};

export const getLinkedStudents = async (guardianId: string): Promise<LinkedStudent[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('guardian_students_view')
        .select('*')
        .eq('guardian_id', guardianId)
        .order('updated_at', { ascending: false });
    if (error) {
        console.error('Error fetching linked students:', error);
        return [];
    }
    return (data ?? []) as LinkedStudent[];
};

export const createStudentInvite = async (relationship: 'parent' | 'teacher') => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('create_student_invite', { relationship });
    if (error) {
        console.error('Error creating invite:', error);
        return null;
    }
    // Supabase RPC returns an array for TABLE returns
    return Array.isArray(data) ? data[0] : data;
};

export const redeemStudentInvite = async (invite_code: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('redeem_student_invite', { invite_code });
    if (error) {
        console.error('Error redeeming invite:', error);
        throw new Error(error.message);
    }
    return Array.isArray(data) ? data[0] : data;
};

// Leaderboard functions
export const getLeaderboard = async (limit = 10) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .limit(limit);
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
    return data || [];
};

// Achievement functions
export const getUserAchievements = async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('user_achievements')
        .select(`
      id,
      unlocked_at,
      achievements (
        id,
        name,
        description,
        icon,
        category
      )
    `)
        .eq('user_id', userId);
    if (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }
    return data || [];
};

export const getAllAchievements = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('achievements')
        .select('*');
    if (error) {
        console.error('Error fetching all achievements:', error);
        return [];
    }
    return data || [];
};

// Topic breakdown
export const getTopicBreakdown = async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('solution_topics_view')
        .select('*')
        .eq('user_id', userId);
    if (error) {
        console.error('Error fetching topic breakdown:', error);
        return [];
    }
    return data || [];
};
