"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, loading, error, clearError } = useAuth();

  const [tab, setTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    targetBand: "7.0",
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (tab === "signin") {
        if (!formData.email || !formData.password) {
          setLocalError("Email and password are required");
          return;
        }
        await login(formData.email, formData.password);
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          setLocalError("All fields are required");
          return;
        }
        await register(formData.name, formData.email, formData.password, Number(formData.targetBand));
      }
    } catch (err) {
      setLocalError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low border-r border-outline-variant/20 flex-col justify-between p-12">
        <Link href="/" className="font-montserrat font-black text-headline-md text-primary tracking-tight">
          IELTS Scholar
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant/60 border border-outline-variant/30 mb-8">
            <Icon name="auto_awesome" size={14} className="text-primary" />
            <span className="font-montserrat text-label-sm text-primary">AI-Powered IELTS Preparation</span>
          </div>
          <h1 className="font-montserrat font-bold text-on-surface mb-4" style={{ fontSize: "40px", lineHeight: "48px" }}>
            Your path to
            <br />
            <span className="text-primary">Band 8+</span> starts here.
          </h1>
          <p className="font-montserrat text-body-lg text-on-surface-variant max-w-md">
            Join 50,000 students using AI-powered feedback, adaptive practice, and real exam simulations.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { v: "50K+", l: "Students" },
              { v: "+1.5", l: "Avg Band Gain" },
              { v: "96%", l: "AI Accuracy" },
            ].map(({ v, l }) => (
              <div key={l} className="bento-card text-center py-5">
                <p className="font-montserrat font-bold text-headline-md text-primary">{v}</p>
                <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-montserrat text-label-sm text-on-surface-variant">
          © {new Date().getFullYear()} IELTS Scholar · Privacy · Terms
        </p>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-8 font-montserrat font-black text-headline-md text-primary tracking-tight">
            IELTS Scholar
          </Link>

          {/* Tab switcher */}
          <div className="flex rounded-xl border border-outline-variant/20 bg-surface-container-low p-1 mb-8">
            {["signin", "signup"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg font-montserrat text-label-lg transition-all ${
                  tab === t
                    ? "bg-white text-on-surface shadow-card"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error message */}
          {(error || localError) && (
            <div className="p-4 rounded-xl bg-error/10 border border-error text-error font-montserrat text-body-sm mb-4">
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h2 className="font-montserrat font-bold text-headline-md text-on-surface">
                {tab === "signin" ? "Welcome back" : "Start your journey"}
              </h2>
              <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                {tab === "signin"
                  ? "Sign in to continue your preparation."
                  : "Create an account to begin preparing for your exam."}
              </p>
            </div>

            {tab === "signup" && (
              <div>
                <label className="block font-montserrat text-label-lg text-on-surface mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Arjun Sharma"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-white font-montserrat text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block font-montserrat text-label-lg text-on-surface mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-white font-montserrat text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-montserrat text-label-lg text-on-surface">Password</label>
                {tab === "signin" && (
                  <Link href="#" className="font-montserrat text-label-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-outline-variant/40 bg-white font-montserrat text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
                </button>
              </div>
            </div>

            {tab === "signup" && (
              <div>
                <label className="block font-montserrat text-label-lg text-on-surface mb-2">
                  Target Band Score
                </label>
                <select
                  name="targetBand"
                  value={formData.targetBand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-white font-montserrat text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  {["6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="block text-center w-full font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl py-3.5 hover:opacity-90 disabled:opacity-60 transition-opacity font-semibold mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  {tab === "signin" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span>{tab === "signin" ? "Sign In" : "Create Account"}</span>
              )}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-outline-variant/40" />
              <span className="font-montserrat text-label-sm text-on-surface-variant">or continue with</span>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            <button className="w-full flex items-center justify-center gap-3 border border-outline-variant/40 rounded-xl py-3 font-montserrat text-label-lg text-on-surface hover:bg-surface-container-low transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="font-montserrat text-label-sm text-on-surface-variant text-center mt-6">
            {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline font-semibold"
            >
              {tab === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
