"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
//import { createClient } from "@/lib/supabase-browser";
import { supabase, getUserProfile } from '../lib/supabase';
import { useLocation, useNavigate } from "react-router-dom";

// CRM app URL - after login, users are redirected here
const CRM_URL = import.meta.env.VITE_SUPABASE_URL;



function AccessPageContent() {
    const [step, setStep] = useState<"email" | "password-creation" | "password-login">("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    //const router = useRouter();
    //const searchParams = useSearchParams();

    //const location = useLocation();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        // Simulate API delay
        setTimeout(() => {
            // Mock logic: if email contains 'new', it's a new user flow
            if (email.toLowerCase().includes("new")) {
                setStep("password-creation");
            } else {
                setStep("password-login");
            }
            setLoading(false);
        }, 800);
    };

    const handlePasswordCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            toast.success("Account secured. Redirecting to CRM...");
            setLoading(false);
            window.location.href = CRM_URL;
        }, 1000);
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            if (password === "error") {
                toast.error("Invalid credentials (mock error)");
                setLoading(false);
            } else {
                toast.success("Access granted. Redirecting to CRM...");
                setLoading(false);
                window.location.href = CRM_URL;
            }
        }, 1000);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        //const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(CRM_URL)}`,
            },
        });

        if (error) {
            toast.error("Failed to connect to Google: " + error.message, {
                style: {
                    background: '#1a1a1a',
                    color: '#ff6b6b',
                    border: '1px solid rgba(255,107,107,0.2)'
                }
            });
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Background elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl"
                >
                    <div className="flex flex-col items-center mb-8">
                        <img src="/cxtrack-logo.png" alt="CxTrack" className="h-12 mb-6 opacity-90" />
                        <h1 className="text-3xl font-bold text-white tracking-tight text-center">
                            {step === "password-creation" ? "Secure Your Workspace" : "Access Your Workspace"}
                        </h1>
                        <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
                            {step === "email" && "Enter your email to verify or create your account."}
                            {step === "password-login" && `Welcome back, ${email}`}
                            {step === "password-creation" && "Create a password to secure your unified CRM dashboard."}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === "email" && (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleEmailSubmit}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@business.com"
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all font-sans"
                                    />
                                </div>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
                                >
                                    {loading ? "Discovering Workspace..." : "Continue"}
                                </button>

                                <div className="relative flex items-center py-4">
                                    <div className="flex-grow border-t border-white/[0.05]"></div>
                                    <span className="flex-shrink mx-4 text-white/20 text-[10px] uppercase tracking-widest font-medium">Or continue with</span>
                                    <div className="flex-grow border-t border-white/[0.05]"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </motion.form>
                        )}

                        {step === "password-creation" && (
                            <motion.form
                                key="creation"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handlePasswordCreation}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">Create Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all font-sans"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all font-sans"
                                    />
                                </div>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
                                >
                                    {loading ? "Locking in Access..." : "Complete Setup"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep("email")}
                                    className="w-full text-white/20 hover:text-white/40 text-xs transition-colors"
                                >
                                    Use a different email
                                </button>
                            </motion.form>
                        )}

                        {step === "password-login" && (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handlePasswordLogin}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all font-sans"
                                    />
                                </div>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
                                >
                                    {loading ? "Verifying Identity..." : "Access Dashboard"}
                                </button>
                                <div className="flex justify-between px-1">
                                    <button
                                        type="button"
                                        onClick={() => setStep("email")}
                                        className="text-white/20 hover:text-white/40 text-xs transition-colors"
                                    >
                                        Use a different email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toast.success("Mock: Recovery email sent to " + email)}
                                        className="text-[#FFD700]/60 hover:text-[#FFD700] text-xs transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>

                <p className="text-white/10 text-[10px] uppercase tracking-widest font-bold text-center mt-8">
                    &copy; 2026 CxTrack Intelligent Systems. Proprietary Access Only.
                </p>
            </div>
        </main>
    );
}

export default function AccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </main>
        }>
            <AccessPageContent />
        </Suspense>
    );
}
