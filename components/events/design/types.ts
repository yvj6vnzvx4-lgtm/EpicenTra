export type ElementType =
  | "booth"
  | "stage"
  | "signage"
  | "entry"
  | "seating"
  | "zone"
  | "barrier";

export interface LayoutElement {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  z: number;
  rotationY: number;
  color: string;
  width: number;
  height: number;
  depth: number;
  notes: string;
}

export interface LayoutData {
  venueWidth: number;
  venueDepth: number;
  elements: LayoutElement[];
}

export const ELEMENT_DEFAULTS: Record<
  ElementType,
  Omit<LayoutElement, "id" | "x" | "z">
> = {
  booth: {
    type: "booth",
    label: "Booth",
    rotationY: 0,
    color: "#3B82F6",
    width: 8,
    height: 4,
    depth: 8,
    notes: "",
  },
  stage: {
    type: "stage",
    label: "Stage",
    rotationY: 0,
    color: "#1E293B",
    width: 24,
    height: 5,
    depth: 16,
    notes: "",
  },
  signage: {
    type: "signage",
    label: "Sign",
    rotationY: 0,
    color: "#8B5CF6",
    width: 2,
    height: 10,
    depth: 8,
    notes: "",
  },
  entry: {
    type: "entry",
    label: "Entry / Exit",
    rotationY: 0,
    color: "#10B981",
    width: 10,
    height: 3,
    depth: 4,
    notes: "",
  },
  seating: {
    type: "seating",
    label: "Seating Area",
    rotationY: 0,
    color: "#F59E0B",
    width: 14,
    height: 3,
    depth: 14,
    notes: "",
  },
  zone: {
    type: "zone",
    label: "Zone",
    rotationY: 0,
    color: "#06B6D4",
    width: 20,
    height: 0.4,
    depth: 20,
    notes: "",
  },
  barrier: {
    type: "barrier",
    label: "Barrier",
    rotationY: 0,
    color: "#94A3B8",
    width: 24,
    height: 4,
    depth: 1,
    notes: "",
  },
};

export const DEFAULT_LAYOUT: LayoutData = {
  venueWidth: 120,
  venueDepth: 80,
  elements: [],
};
