"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const LOGIN_TIMEOUT_MS = 6000;
const AUTH_UNAVAILABLE_ERROR = "AUTH_SERVICE_UNAVAILABLE";

const DOT_COLORS = ["#1565C0", "#2089E1", "#5BC5F2", "#7CE1FB", "#4A7FD4", "#7DD3F0"];

type Dot = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
};

function generateDots(count: number): Dot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 15 + Math.random() * 70,
    size: 5 + Math.random() * 7,
    color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
    delay: Math.random() * 600,
    duration: 1200 + Math.random() * 600,
  }));
}

const BrandMark = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 520 521" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 181C0 114.726 53.7258 61 120 61H400V61C400 127.274 346.274 181 280 181H0V181Z" fill="#1565C0" fillOpacity="0.9"/>
    <path d="M180 521C113.726 521 60 467.274 60 401L60 121C126.274 121 180 174.726 180 241V521Z" fill="#7CE1FB" fillOpacity="0.9"/>
    <path d="M120 461C120 394.726 173.726 341 240 341H520C520 407.274 466.274 461 400 461H120Z" fill="#5BC5F2" fillOpacity="0.9"/>
    <path d="M460 401C393.726 401 340 347.274 340 281V0C406.274 0 460 53.7258 460 120V401Z" fill="#2089E1" fillOpacity="0.9"/>
    <rect x="335" y="61" width="5" height="120" fill="white" fillOpacity="0.6"/>
    <rect x="180" y="341" width="5" height="120" fill="white" fillOpacity="0.6"/>
    <rect x="60" y="186" width="5" height="120" transform="rotate(-90 60 186)" fill="white" fillOpacity="0.6"/>
    <rect x="340" y="341" width="5" height="120" transform="rotate(-90 340 341)" fill="white" fillOpacity="0.6"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [dots] = useState<Dot[]>(() => generateDots(28));
  const hasRevealed = useRef(false);

  function handleHover() {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    setRevealed(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await Promise.race([
        signIn("credentials", { email, password, redirect: false }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(AUTH_UNAVAILABLE_ERROR)), LOGIN_TIMEOUT_MS)
        ),
      ]);

      if (result?.error === AUTH_UNAVAILABLE_ERROR) {
        setError("Login is temporarily unavailable. Please try again.");
        setLoading(false);
      } else if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
      } else {
        // Trigger bubble-up animation, then navigate
        setSigningIn(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1400);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === AUTH_UNAVAILABLE_ERROR
          ? "Login is temporarily unavailable. Please try again."
          : "Login failed. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 mesh-blue flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* Hero — hover trigger */}
      <div
        className="flex flex-col items-center cursor-default select-none"
        onMouseEnter={handleHover}
      >
        {/* Logo mark — stays full size on hover, bubbles up on sign-in */}
        <div
          style={{
            position: "relative",
            overflow: "visible",
            width: 96,
            height: 96,
          }}
        >
          {/* Dots — only on sign-in */}
          {signingIn && dots.map((dot) => (
            <span
              key={dot.id}
              style={{
                position: "absolute",
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                borderRadius: "50%",
                backgroundColor: dot.color,
                animation: `dotRise ${dot.duration}ms ease-out ${dot.delay}ms both`,
                boxShadow: `0 0 8px ${dot.color}`,
              }}
            />
          ))}

          {/* Logo — fades out on sign-in */}
          <BrandMark
            className="w-full h-full"
            style={{
              transition: "opacity 900ms ease-out, filter 900ms ease-out",
              opacity: signingIn ? 0 : 1,
              filter: signingIn ? "blur(6px)" : "none",
            }}
          />
        </div>

        {/* Wordmark */}
        <p
          className="font-display font-black uppercase tracking-[0.08em] text-white mt-4"
          style={{
            fontSize: revealed ? "1.5rem" : "3rem",
            transition: "font-size 1400ms ease-out, opacity 900ms ease-out, margin-top 1400ms ease-out",
            marginTop: revealed ? "0.75rem" : "1rem",
            opacity: signingIn ? 0 : 1,
          }}
        >
          EpicenTra
        </p>

        {/* Tagline */}
        <p
          className="text-brand-coral font-semibold tracking-widest uppercase"
          style={{
            transition: "font-size 1400ms ease-out, opacity 900ms ease-out, margin-top 1400ms ease-out",
            fontSize: revealed ? "0.65rem" : "0.75rem",
            marginTop: revealed ? "0.2rem" : "0.5rem",
            opacity: signingIn ? 0 : revealed ? 0.5 : 1,
          }}
        >
          Plan Smarter. Launch Faster. Events Redefined.
        </p>

        {/* Hover hint */}
        <div
          style={{
            transition: "opacity 700ms ease-out, max-height 800ms ease-out, margin-top 800ms ease-out",
            opacity: revealed ? 0 : 1,
            maxHeight: revealed ? 0 : "80px",
            marginTop: revealed ? 0 : "1.5rem",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: revealed ? "none" : "auto",
          }}
        >
          <p className="text-[11px] text-[#6B7A99] uppercase tracking-[0.2em]">hover to enter</p>
          <ChevronDown className="w-4 h-4 text-[#6B7A99] mt-1 animate-bounce" />
        </div>
      </div>

      {/* Login card */}
      <div
        className="w-full max-w-sm"
        style={{
          transition: "opacity 1100ms ease-out 400ms, transform 1200ms ease-out 400ms, max-height 1200ms ease-out 200ms, margin-top 1200ms ease-out 200ms",
          opacity: signingIn ? 0 : revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(30px)",
          maxHeight: revealed ? "700px" : "0px",
          marginTop: revealed ? "2rem" : 0,
          overflow: "hidden",
          pointerEvents: revealed && !signingIn ? "auto" : "none",
        }}
      >
        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-8 shadow-2xl">
          <h1 className="font-display font-bold text-xl text-white mb-1 uppercase tracking-wide">
            Welcome back
          </h1>
          <p className="text-[#6B7A99] text-sm mb-6">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-brand-red bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          {/* Create account link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[#6B7A99]">
              New here?{" "}
              <Link href="/register" className="text-brand-cyan hover:text-white transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-navy-700">
            <p className="text-xs text-[#6B7A99] mb-3 font-medium uppercase tracking-wider">
              Demo accounts
            </p>
            <div className="space-y-1.5">
              {[
                { email: "melissa@acme.com", role: "Director" },
                { email: "james@acme.com", role: "Manager" },
                { email: "alex@acme.com", role: "Coordinator" },
              ].map(({ email: demoEmail, role }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword("password123");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-navy-900/50 hover:bg-navy-900 border border-navy-700 transition-colors group"
                >
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">
                    {demoEmail}
                  </span>
                  <span className="text-xs text-slate-600 group-hover:text-slate-500">{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
