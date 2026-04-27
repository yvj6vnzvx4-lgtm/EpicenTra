"use client";

import { LayoutElement } from "./types";
import { Trash2, X } from "lucide-react";

const COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#EC4899", "#1E293B", "#94A3B8", "#F97316",
];

interface PropertiesPanelProps {
  element: LayoutElement;
  onChange: (id: string, updates: Partial<LayoutElement>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PropertiesPanel({
  element,
  onChange,
  onDelete,
  onClose,
}: PropertiesPanelProps) {
  function field(label: string, content: React.ReactNode) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
        {content}
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Properties
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Label */}
        {field(
          "Label",
          <input
            type="text"
            value={element.label}
            onChange={(e) => onChange(element.id, { label: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        )}

        {/* Color */}
        {field(
          "Color",
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange(element.id, { color: c })}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline:
                    element.color === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        )}

        {/* Dimensions */}
        {field(
          "Width (ft)",
          <input
            type="number"
            min={1}
            value={element.width}
            onChange={(e) =>
              onChange(element.id, { width: Number(e.target.value) || 1 })
            }
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        )}

        {field(
          "Depth (ft)",
          <input
            type="number"
            min={1}
            value={element.depth}
            onChange={(e) =>
              onChange(element.id, { depth: Number(e.target.value) || 1 })
            }
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        )}

        {field(
          "Height (ft)",
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={element.height}
            onChange={(e) =>
              onChange(element.id, { height: Number(e.target.value) || 0.5 })
            }
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        )}

        {field(
          "Rotation (°)",
          <input
            type="range"
            min={0}
            max={360}
            step={15}
            value={element.rotationY}
            onChange={(e) =>
              onChange(element.id, { rotationY: Number(e.target.value) })
            }
            className="w-full accent-brand-blue"
          />
        )}
        <p className="text-xs text-slate-400 -mt-2">{element.rotationY}°</p>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          {field(
            "X (ft)",
            <input
              type="number"
              step={1}
              value={Math.round(element.x)}
              onChange={(e) =>
                onChange(element.id, { x: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          )}
          {field(
            "Z (ft)",
            <input
              type="number"
              step={1}
              value={Math.round(element.z)}
              onChange={(e) =>
                onChange(element.id, { z: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          )}
        </div>

        {/* Notes */}
        {field(
          "Notes",
          <textarea
            rows={3}
            value={element.notes}
            onChange={(e) => onChange(element.id, { notes: e.target.value })}
            placeholder="Any notes about this element…"
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
          />
        )}
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => onDelete(element.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-red hover:bg-red-50 transition-colors border border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          Delete Element
        </button>
      </div>
    </div>
  );
}
