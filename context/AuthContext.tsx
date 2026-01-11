
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { getProfile, getUserStats } from '../services/databaseService';
import { Profile, UserStats } from '../types';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timeoutId: number | undefined;
    const timeout = new Promise<T>((_resolve, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    });
}

interface AuthContextType {
    user: any | null;
    profile: Profile | null;
    stats: UserStats | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to upsert profile with Google OAuth data
const syncProfileWithGoogleData = async (user: any): Promise<Profile | null> => {
    if (!supabase || !user) return null;

    // Get Google user metadata
    const googleMetadata = user.user_metadata || {};
    const fullName = googleMetadata.full_name || googleMetadata.name || '';
    const avatarUrl = googleMetadata.avatar_url || googleMetadata.picture || '';
    const email = user.email || '';

    // Check if profile exists
    let existingProfile = null;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);

        if (!error && data && data.length > 0) {
            existingProfile = data[0];
        }
    } catch (e) {
        console.error('Error checking existing profile:', e);
    }

    if (existingProfile) {
        // Update existing profile with Google data if fields are empty
        const needsUpdate =
            (!existingProfile.full_name && fullName) ||
            (!existingProfile.avatar_url && avatarUrl) ||
            (!existingProfile.username && email);

        if (needsUpdate) {
            try {
                const { data: updatedProfile, error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: existingProfile.full_name || fullName,
                        avatar_url: existingProfile.avatar_url || avatarUrl,
                        username: existingProfile.username || email.split('@')[0],
                    })
                    .eq('id', user.id)
                    .select('*')
                    .maybeSingle();

                if (!error && updatedProfile) {
                    return updatedProfile;
                }
            } catch (error) {
                console.error('Error updating profile with Google data:', error);
            }
            return existingProfile;
        }
        return existingProfile;
    } else {
        // Create new profile with Google data
        const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                username: email.split('@')[0],
                full_name: fullName,
                avatar_url: avatarUrl,
                points: 0,
                streak: 0,
                accuracy: 0,
                study_time: '0h',
                mastered_topics: 0,
                difficulty_level: 'standard',
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            // Return a fallback profile with Google data
            return {
                id: user.id,
                username: email.split('@')[0],
                full_name: fullName,
                avatar_url: avatarUrl,
                points: 0,
                streak: 0,
                accuracy: 0,
                study_time: '0h',
                mastered_topics: 0,
                difficulty_level: 'standard',
                created_at: new Date().toISOString(),
            };
        }
        return newProfile;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfileAndStats = async (u: any) => {
        if (!supabase || !u?.id) return;
        try {
            const [profileData, statsData] = await Promise.all([
                withTimeout(syncProfileWithGoogleData(u), 8000, 'syncProfileWithGoogleData'),
                withTimeout(getUserStats(u.id), 8000, 'getUserStats'),
            ]);
            setProfile(profileData);
            setStats(statsData);
        } catch (e) {
            console.error('Error loading profile/stats:', e);
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await loadProfileAndStats(user);
        }
    };

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const initAuth = async () => {
            try {
                // Only block the UI on session lookup. Profile/stats can load in the background.
                const { data: { session } } = await withTimeout(supabase.auth.getSession(), 6000, 'getSession');
                const currentUser = session?.user ?? null;

                if (isMounted) {
                    setUser(currentUser);
                }

                // Kick off profile/stats fetch without blocking `loading`.
                if (currentUser) void loadProfileAndStats(currentUser);
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // Never allow auth-change flow to hold the global spinner.
            setLoading(false);

            if (currentUser) {
                void loadProfileAndStats(currentUser);
            } else {
                setProfile(null);
                setStats(null);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (supabase) {
            await supabase.auth.signOut({ scope: 'global' });
        }
        setUser(null);
        setProfile(null);
        setStats(null);
        // Force reload to clear any cached state and return to landing page
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, profile, stats, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
