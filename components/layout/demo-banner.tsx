"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

const DEMO_ORG_SLUG = "acme-brand-co";

export function DemoBanner() {
  const { data: session } = useSession();

  if (session?.user?.organizationSlug !== DEMO_ORG_SLUG) return null;

  return (
    <div className="w-full bg-brand-amber/10 border-b border-brand-amber/20 px-4 py-2 flex items-center justify-center gap-3 text-xs">
      <span className="text-brand-amber font-semibold uppercase tracking-wider">Demo mode</span>
      <span className="text-[#6B7A99]">This account is read-only.</span>
      <Link
        href="/register"
        className="text-brand-cyan hover:text-white transition-colors font-medium"
      >
        Create your own account →
      </Link>
    </div>
  );
}
