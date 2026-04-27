"use client";

import { SpaceBuilder } from "./space-builder";
import type { LayoutData } from "./types";

interface DesignStudioShellProps {
  eventId: string;
  initialLayout: LayoutData | null;
}

export function DesignStudioShell({ eventId, initialLayout }: DesignStudioShellProps) {
  return (
    <div className="-m-4 min-h-[calc(100%+2rem)] sm:-m-6 sm:min-h-[calc(100%+3rem)]">
      <SpaceBuilder eventId={eventId} initialLayout={initialLayout} />
    </div>
  );
}
