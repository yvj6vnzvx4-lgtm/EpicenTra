import { MobileDashboardShell } from "@/components/layout/mobile-dashboard-shell";
import { CommandPaletteWrapper } from "@/components/layout/command-palette-wrapper";
import { DemoBanner } from "@/components/layout/demo-banner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <MobileDashboardShell>{children}</MobileDashboardShell>
      <CommandPaletteWrapper />
    </>
  );
}
