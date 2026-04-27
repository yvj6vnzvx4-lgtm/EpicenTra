"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BrandMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 520 521" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", orgName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          orgName: form.orgName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 mesh-blue flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* Brand header */}
      <div className="flex flex-col items-center mb-8 select-none">
        <BrandMark className="w-12 h-12" />
        <p className="font-display font-black uppercase tracking-[0.08em] text-white text-2xl mt-3">
          EpicenTra
        </p>
        <p className="text-brand-coral font-semibold tracking-widest uppercase text-[10px] mt-1 opacity-60">
          Plan Smarter. Launch Faster. Events Redefined.
        </p>
      </div>

      {/* Register card */}
      <div className="w-full max-w-sm">
        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-8 shadow-2xl">
          <h1 className="font-display font-bold text-xl text-white mb-1 uppercase tracking-wide">
            Create account
          </h1>
          <p className="text-[#6B7A99] text-sm mb-6">Set up your workspace in seconds</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={set("name")}
              required
              autoComplete="name"
            />
            <Input
              id="orgName"
              label="Organization name"
              type="text"
              placeholder="Acme Events Co."
              value={form.orgName}
              onChange={set("orgName")}
              required
              autoComplete="organization"
            />
            <Input
              id="email"
              label="Work email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set("password")}
              required
              autoComplete="new-password"
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              required
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-brand-red bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-navy-700 text-center">
            <p className="text-xs text-[#6B7A99]">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-cyan hover:text-white transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
