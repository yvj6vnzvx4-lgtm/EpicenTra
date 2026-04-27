"use client";

import { View, Download, Save, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  topDown: boolean;
  onToggleView: () => void;
  onSave: () => void;
  onExport: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  venueWidth: number;
  venueDepth: number;
  onVenueChange: (width: number, depth: number) => void;
}

export function Toolbar({
  topDown,
  onToggleView,
  onSave,
  onExport,
  saveStatus,
  venueWidth,
  venueDepth,
  onVenueChange,
}: ToolbarProps) {
  return (
    <div className="h-11 bg-white border-b border-slate-200 flex items-center gap-2 px-3 shrink-0">
      {/* View toggle */}
      <button
        onClick={onToggleView}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          topDown
            ? "bg-brand-blue text-white"
            : "text-slate-600 hover:bg-slate-100 border border-slate-200"
        )}
      >
        {topDown ? (
          <Maximize2 className="w-3.5 h-3.5" />
        ) : (
          <View className="w-3.5 h-3.5" />
        )}
        {topDown ? "Plan View" : "3D View"}
      </button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Venue dimensions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Venue:</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={20}
            max={1000}
            value={venueWidth}
            onChange={(e) => onVenueChange(Number(e.target.value) || 120, venueDepth)}
            className="w-16 px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <span className="text-xs text-slate-400">×</span>
          <input
            type="number"
            min={20}
            max={1000}
            value={venueDepth}
            onChange={(e) => onVenueChange(venueWidth, Number(e.target.value) || 80)}
            className="w-16 px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <span className="text-xs text-slate-400">ft</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Save status */}
        {saveStatus !== "idle" && (
          <span
            className={`text-xs ${
              saveStatus === "saving"
                ? "text-slate-400"
                : saveStatus === "saved"
                  ? "text-brand-green"
                  : "text-brand-red"
            }`}
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved"
                : "Save failed"}
          </span>
        )}

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export PNG
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-blue text-white hover:bg-brand-blue-dark transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Layout
        </button>
      </div>
    </div>
  );
}
