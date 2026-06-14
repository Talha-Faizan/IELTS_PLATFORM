"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <nav className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20 w-full">
      <div className="max-w-container-max mx-auto px-margin-desktop h-navbar-height flex items-center justify-between">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="font-montserrat text-headline-md font-black text-primary tracking-tight transition-transform active:scale-95"
          >
            IELTS Scholar
          </Link>
          {isAuthenticated && (
            <ul className="hidden md:flex gap-8">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Practice", href: "/practice" },
                { name: "Mock Tests", href: "/mock-tests" },
                { name: "Analytics", href: "/analytics" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="font-montserrat text-label-lg text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <button
                className="text-primary cursor-pointer hover:opacity-70 transition-opacity hidden md:block"
                aria-label="Notifications"
                onClick={() => {}}
              >
                <Icon name="bell" size={20} />
              </button>
              <div className="relative">
                <button
                  className="text-primary cursor-pointer hover:opacity-70 transition-opacity hidden md:block"
                  aria-label="User account menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <Icon name="user" size={20} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-outline-variant/20 shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-outline-variant/20">
                      <p className="font-montserrat text-label-lg font-semibold text-on-surface">{user?.name}</p>
                      <p className="font-montserrat text-label-sm text-on-surface-variant">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 font-montserrat text-label-lg text-error hover:bg-error/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {!isAuthenticated && (
            <div className="hidden md:flex gap-3 ml-4">
              <Link
                href="/login"
                className="font-montserrat text-label-lg text-primary border border-primary rounded-lg px-4 py-2 hover:bg-surface-variant/50 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/login?tab=signup"
                className="font-montserrat text-label-lg bg-primary-container text-on-primary rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-on-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface px-margin-desktop py-4 flex flex-col gap-3">
          {[
            { name: "Dashboard", href: "/dashboard" },
            { name: "Practice", href: "/practice" },
            { name: "Mock Tests", href: "/mock-tests" },
            { name: "Analytics", href: "/analytics" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-montserrat text-body-md text-on-surface-variant py-2 border-b border-outline-variant/10"
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              href="/login"
              className="flex-1 text-center font-montserrat text-label-lg text-primary border border-primary rounded-lg px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="flex-1 text-center font-montserrat text-label-lg bg-primary-container text-on-primary rounded-lg px-4 py-2"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
