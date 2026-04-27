"use client";

import { ElementType } from "./types";
import {
  Square,
  RectangleHorizontal,
  AlignJustify,
  ArrowRightFromLine,
  LayoutGrid,
  Minus,
  Box,
} from "lucide-react";

const PALETTE_ITEMS: {
  type: ElementType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    type: "booth",
    label: "Booth / Table",
    description: "Exhibit or vendor booth",
    icon: Square,
    color: "#3B82F6",
  },
  {
    type: "stage",
    label: "Stage",
    description: "Performance or presentation area",
    icon: RectangleHorizontal,
    color: "#1E293B",
  },
  {
    type: "signage",
    label: "Signage",
    description: "Banner or display sign",
    icon: AlignJustify,
    color: "#8B5CF6",
  },
  {
    type: "entry",
    label: "Entry / Exit",
    description: "Door or gate point",
    icon: ArrowRightFromLine,
    color: "#10B981",
  },
  {
    type: "seating",
    label: "Seating Area",
    description: "Audience or lounge seating",
    icon: LayoutGrid,
    color: "#F59E0B",
  },
  {
    type: "zone",
    label: "Custom Zone",
    description: "Labeled floor area",
    icon: Box,
    color: "#06B6D4",
  },
  {
    type: "barrier",
    label: "Barrier",
    description: "Rope, fence, or crowd barrier",
    icon: Minus,
    color: "#94A3B8",
  },
];

interface ElementPaletteProps {
  onAdd: (type: ElementType) => void;
}

export function ElementPalette({ onAdd }: ElementPaletteProps) {
  return (
    <div className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Elements
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Click to add to scene</p>
      </div>

      <div className="p-2 space-y-1">
        {PALETTE_ITEMS.map(({ type, label, description, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: color + "20", color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 leading-tight">
                {label}
              </p>
              <p className="text-xs text-slate-400 truncate">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Click an element to place it on the floor. Select to reposition.
        </p>
      </div>
    </div>
  );
}
