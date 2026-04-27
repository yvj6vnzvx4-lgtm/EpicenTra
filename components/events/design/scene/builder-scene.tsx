"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Floor } from "./floor";
import { LayoutElement } from "./layout-element";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { LayoutElement as LayoutElementType } from "../types";

interface BuilderSceneProps {
  elements: LayoutElementType[];
  venueWidth: number;
  venueDepth: number;
  selectedId: string | null;
  topDown: boolean;
  onSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, z: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function BuilderScene({
  elements,
  venueWidth,
  venueDepth,
  selectedId,
  topDown,
  onSelect,
  onElementMove,
  canvasRef,
}: BuilderSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const cameraPos: [number, number, number] = topDown
    ? [0, Math.max(venueWidth, venueDepth) * 1.1, 0.001]
    : [venueWidth * 0.7, venueDepth * 0.6, venueDepth * 0.8];

  return (
    <Canvas
      ref={canvasRef}
      shadows
      camera={{
        position: cameraPos,
        fov: 45,
        near: 0.1,
        far: 5000,
      }}
      gl={{ preserveDrawingBuffer: true }}
      onPointerMissed={() => onSelect(null)}
      className="w-full h-full"
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[venueWidth / 2, 80, venueDepth / 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-venueWidth / 2, 40, -venueDepth / 2]} intensity={0.4} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Scene content */}
      <Floor width={venueWidth} depth={venueDepth} />

      {elements.map((el) => (
        <LayoutElement
          key={el.id}
          element={el}
          isSelected={el.id === selectedId}
          onSelect={onSelect}
          onDragEnd={onElementMove}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate={!topDown}
        minDistance={10}
        maxDistance={Math.max(venueWidth, venueDepth) * 2.5}
        target={[0, 0, 0]}
        makeDefault
      />
    </Canvas>
  );
}
