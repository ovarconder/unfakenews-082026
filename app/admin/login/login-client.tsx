"use client";

import { useState, useEffect } from "react";
import { loginAdmin, signInWithGoogle, signInWithFacebook, isGoogleOAuthConfigured, isFacebookOAuthConfigured } from "./actions";
import {
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSettings } from "@/components/admin/settings-context";

// Key for storing session info in sessionStorage
const SESSION_KEY = "siam_admin_session";

export default function AdminLoginClient() {
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage";
  const logoUrl = settings?.logo || process.env.NEXT_PUBLIC_SITE_LOGO || "/images/logo/logo-light.png";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);

  useEffect(() => {
    // Check OAuth configuration status on mount
    async function checkConfig() {
      try {
        const [gEnabled, fEnabled] = await Promise.all([
          isGoogleOAuthConfigured(),
          isFacebookOAuthConfigured(),
        ]);
        setGoogleEnabled(gEnabled);
        setFacebookEnabled(fEnabled);
      } catch {
        // If check fails, assume not configured
      }
      setConfigChecked(true);
    }
    checkConfig();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAdmin(email, password);

      if (!result.success) {
        setError(result.error === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : result.error || "Login failed"
        );
        return;
      }

      // Store session in sessionStorage
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      
      // Redirect to admin dashboard
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleEnabled) {
      setError("Google OAuth ยังไม่ได้ตั้งค่า กรุณาตั้งค่าในเมนู Settings > API Keys");
      return;
    }
    setError(null);
    try {
      const { url } = await signInWithGoogle();
      if (url) window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Google login failed");
    }
  };

  const handleFacebookLogin = async () => {
    if (!facebookEnabled) {
      setError("Facebook OAuth ยังไม่ได้ตั้งค่า กรุณาตั้งค่าในเมนู Settings > API Keys");
      return;
    }
    setError(null);
    try {
      const { url } = await signInWithFacebook();
      if (url) window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Facebook login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoUrl}
            alt={siteName}
            className="h-16 mx-auto mb-3"
          />
          <p className="text-white/50 text-sm">Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-8">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm mb-6">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading || !configChecked || !googleEnabled}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all disabled:opacity-50 ${
                googleEnabled
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-amber-300/30"
                  : "bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed"
              }`}
              title={!googleEnabled ? "Google OAuth ยังไม่ได้ตั้งค่า" : "เข้าสู่ระบบด้วย Google"}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              เข้าสู่ระบบด้วย Google
              {!googleEnabled && configChecked && (
                <span className="text-[10px] text-white/20 ml-auto">ยังไม่ได้ตั้งค่า</span>
              )}
              {!configChecked && (
                <span className="w-3 h-3 border border-white/20 border-t-transparent rounded-full animate-spin ml-auto" />
              )}
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={loading || !configChecked || !facebookEnabled}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all disabled:opacity-50 ${
                facebookEnabled
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-amber-300/30"
                  : "bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed"
              }`}
              title={!facebookEnabled ? "Facebook OAuth ยังไม่ได้ตั้งค่า" : "เข้าสู่ระบบด้วย Facebook"}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              เข้าสู่ระบบด้วย Facebook
              {!facebookEnabled && configChecked && (
                <span className="text-[10px] text-white/20 ml-auto">ยังไม่ได้ตั้งค่า</span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0f1f3a] px-2 text-white/40">หรือใช้รหัสผ่าน</span>
            </div>
          </div>

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm mb-2">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@your-email.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 focus:bg-white/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        {/* Hint */}
        <p className="text-center text-white/30 text-xs mt-6">
          ระบบหลังบ้าน {siteName} v2.0
        </p>
      </div>
    </div>
  );
}

function LogIn(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
