"use client";

import { useRef, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { ElementPalette } from "./element-palette";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import {
  ElementType,
  LayoutElement,
  LayoutData,
  ELEMENT_DEFAULTS,
  DEFAULT_LAYOUT,
} from "./types";

// Dynamically import the 3D scene to avoid SSR
const BuilderScene = dynamic(
  () =>
    import("./scene/builder-scene").then((mod) => ({ default: mod.BuilderScene })),
  { ssr: false, loading: () => <SceneLoadingState /> }
);

function SceneLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading 3D scene…</p>
      </div>
    </div>
  );
}

interface SpaceBuilderProps {
  eventId: string;
  initialLayout: LayoutData | null;
}

export function SpaceBuilder({ eventId, initialLayout }: SpaceBuilderProps) {
  const [layout, setLayout] = useState<LayoutData>(
    initialLayout ?? DEFAULT_LAYOUT
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topDown, setTopDown] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedElement = layout.elements.find((e) => e.id === selectedId) ?? null;

  // Add element from palette
  const handleAddElement = useCallback((type: ElementType) => {
    const defaults = ELEMENT_DEFAULTS[type];
    const newEl: LayoutElement = {
      ...defaults,
      id: nanoid(),
      x: 0,
      z: 0,
      label: `${defaults.label} ${Date.now().toString().slice(-3)}`,
    };
    setLayout((prev) => ({
      ...prev,
      elements: [...prev.elements, newEl],
    }));
    setSelectedId(newEl.id);
  }, []);

  // Move element (from drag)
  const handleElementMove = useCallback((id: string, x: number, z: number) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, x, z } : el
      ),
    }));
  }, []);

  // Update element properties
  const handleElementChange = useCallback(
    (id: string, updates: Partial<LayoutElement>) => {
      setLayout((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      }));
    },
    []
  );

  // Delete element
  const handleDelete = useCallback(
    (id: string) => {
      setLayout((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== id),
      }));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId]
  );

  // Venue size change
  const handleVenueChange = useCallback((width: number, depth: number) => {
    setLayout((prev) => ({ ...prev, venueWidth: width, venueDepth: depth }));
  }, []);

  // Save to DB
  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutData: layout }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }

  // Export PNG
  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "floor-plan.png";
    link.href = dataURL;
    link.click();
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        topDown={topDown}
        onToggleView={() => setTopDown((v) => !v)}
        onSave={handleSave}
        onExport={handleExport}
        saveStatus={saveStatus}
        venueWidth={layout.venueWidth}
        venueDepth={layout.venueDepth}
        onVenueChange={handleVenueChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <ElementPalette onAdd={handleAddElement} />

        {/* 3D Canvas */}
        <div className="flex-1 relative bg-slate-100">
          <BuilderScene
            elements={layout.elements}
            venueWidth={layout.venueWidth}
            venueDepth={layout.venueDepth}
            selectedId={selectedId}
            topDown={topDown}
            onSelect={setSelectedId}
            onElementMove={handleElementMove}
            canvasRef={canvasRef}
          />

          {/* Element count badge */}
          <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-500 border border-slate-200 pointer-events-none">
            {layout.elements.length} element{layout.elements.length !== 1 ? "s" : ""}
            {" · "}
            {layout.venueWidth} × {layout.venueDepth} ft
          </div>

          {/* Empty state hint */}
          {layout.elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 px-6 py-4 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Click an element in the palette to add it to the floor plan
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Drag elements to reposition • Click to select • Edit in Properties panel
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Properties panel — only shown when element selected */}
        {selectedElement && (
          <PropertiesPanel
            element={selectedElement}
            onChange={handleElementChange}
            onDelete={handleDelete}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
