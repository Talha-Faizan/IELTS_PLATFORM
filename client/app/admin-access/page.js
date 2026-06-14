"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { loginUser } from "@/lib/slices/authSlice";

export default function AdminAccessPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Redirect if already logged in as admin
  if (user && user.role === "admin") {
    router.push("/admin");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();

      if (result.user && result.user.role === "admin") {
        router.push("/admin");
      } else {
        setError("Access denied. Admin credentials required.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Admin access only.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-montserrat font-black text-headline-lg text-primary tracking-tight">
            IELTS Scholar
          </h1>
          <p className="font-montserrat text-label-md text-on-surface-variant mt-2">
            Admin Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-outline-variant/20 p-8 shadow-lg">
          <h2 className="font-montserrat font-bold text-headline-sm text-on-surface mb-1">
            Admin Portal
          </h2>
          <p className="font-montserrat text-body-sm text-on-surface-variant mb-8">
            Enter your admin credentials to access the panel
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error-container border border-error rounded-lg">
              <p className="font-montserrat text-label-sm text-error">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block font-montserrat text-label-md text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-3 font-montserrat text-body-md bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-montserrat text-label-md text-on-surface-variant mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 font-montserrat text-body-md bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary font-montserrat text-label-lg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Icon name="lock" size={18} />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center font-montserrat text-label-sm text-on-surface-variant mt-6">
            Not an admin?{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              Return to dashboard
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-surface rounded-lg border border-outline-variant/20 flex gap-3">
          <Icon name="shield" size={20} className="text-primary flex-shrink-0 mt-1" />
          <p className="font-montserrat text-label-sm text-on-surface-variant">
            This is a restricted area. Only authorized administrators can access this panel.
          </p>
        </div>
      </div>
    </div>
  );
}
