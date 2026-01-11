import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const LandingPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        if (!supabase) {
            setError('Authentication service not available');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });

            if (authError) {
                setError(authError.message);
            }
        } catch (err) {
            setError('Failed to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        {
            icon: 'photo_camera',
            title: 'Scan & Solve',
            description: 'Point your camera at any homework problem and get instant solutions',
            image: '/images/feature-scan.png',
        },
        {
            icon: 'psychology',
            title: 'AI-Powered',
            description: 'Advanced AI provides step-by-step explanations you can understand',
            image: '/images/feature-ai.png',
        },
        {
            icon: 'trending_up',
            title: 'Track Progress',
            description: 'Monitor your learning journey with detailed analytics and insights',
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            icon: 'emoji_events',
            title: 'Earn Rewards',
            description: 'Gamified learning with achievements, badges, and leaderboards',
            gradient: 'from-amber-500 to-orange-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>

                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                        }}
                    ></div>
                ))}
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Mwakenya</span>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-8 pb-16 md:pt-16 md:pb-24">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                            <span className="material-symbols-outlined text-cyan-400 text-sm">new_releases</span>
                            <span className="text-cyan-400 text-sm font-medium">AI-Powered Learning</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                            Unlock Your
                            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Academic Potential
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
                            Snap a photo of any homework problem and get instant, step-by-step solutions powered by advanced AI.
                        </p>

                        {/* Google Sign In Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white rounded-2xl font-semibold text-gray-800 shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                            ) : (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            <span>Continue with Google</span>
                            <span className="material-symbols-outlined text-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_forward</span>
                        </button>

                        {error && (
                            <p className="mt-4 text-red-400 text-sm">{error}</p>
                        )}

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 mt-10 justify-center md:justify-start">
                            <div className="flex -space-x-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br ${['from-cyan-400 to-blue-500', 'from-purple-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'][i]}`}></div>
                                ))}
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    ))}
                                </div>
                                <p className="text-gray-400 text-sm">Trusted by 10,000+ students</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Hero Image */}
                    <div className="relative hidden md:block">
                        <div className="relative z-10">
                            <img
                                src="/images/hero-student.png"
                                alt="Student using Mwakenya"
                                className="w-full max-w-lg mx-auto drop-shadow-2xl"
                                style={{ filter: 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.3))' }}
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl opacity-80 animate-bounce" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute bottom-20 left-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-80 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                    </div>
                </div>
            </section>

            {/* Mobile Hero Image */}
            <div className="relative z-10 md:hidden px-6 pb-12">
                <img
                    src="/images/hero-student.png"
                    alt="Student using Mwakenya"
                    className="w-full max-w-xs mx-auto drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.3))' }}
                />
            </div>

            {/* Features Section */}
            <section className="relative z-10 px-6 md:px-12 lg:px-20 py-16 md:py-24">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Why Choose Mwakenya?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            The smartest way to learn. Our AI understands your problems and teaches you how to solve them.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2"
                            >
                                {/* Feature Image or Icon */}
                                <div className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center overflow-hidden">
                                    {feature.image ? (
                                        <img src={feature.image} alt={feature.title} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{feature.icon}</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

                                {/* Hover glow effect */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 md:px-12 lg:px-20 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 backdrop-blur-sm border border-white/10 overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10"></div>
                        <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500 rounded-full filter blur-3xl opacity-20"></div>

                        <div className="relative z-10">
                            <span className="material-symbols-outlined text-5xl text-cyan-400 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Excel?
                            </h2>
                            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                                Join thousands of students who are already learning smarter with Mwakenya. Start for free today.
                            </p>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined">login</span>
                                )}
                                <span>Get Started Free</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 md:px-12 lg:px-20 py-8 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        </div>
                        <span className="text-lg font-semibold text-white">Mwakenya</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2026 Mwakenya. All rights reserved.</p>
                </div>
            </footer>

            {/* CSS for floating animation */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
