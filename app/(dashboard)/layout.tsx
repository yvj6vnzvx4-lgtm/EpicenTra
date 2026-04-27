import { MobileDashboardShell } from "@/components/layout/mobile-dashboard-shell";
import { CommandPaletteWrapper } from "@/components/layout/command-palette-wrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileDashboardShell>{children}</MobileDashboardShell>
      <CommandPaletteWrapper />
    </>
  );
}
