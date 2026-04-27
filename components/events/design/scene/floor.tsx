"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface FloorProps {
  width: number;
  depth: number;
}

export function Floor({ width, depth }: FloorProps) {
  // Build a grid texture on a canvas
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, size, size);

    // Minor grid lines (1 ft)
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 0.5;
    const minor = size / 10;
    for (let i = 0; i <= size; i += minor) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Major grid lines (10 ft)
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    const major = size;
    for (let i = 0; i <= size; i += major) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(width / 10, depth / 10);
    return tex;
  }, [width, depth]);

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Venue boundary walls — low, semi-transparent */}
      {[
        { pos: [0, 1, -depth / 2] as [number, number, number], size: [width, 2, 0.5] as [number, number, number] },
        { pos: [0, 1, depth / 2] as [number, number, number], size: [width, 2, 0.5] as [number, number, number] },
        { pos: [-width / 2, 1, 0] as [number, number, number], size: [0.5, 2, depth] as [number, number, number] },
        { pos: [width / 2, 1, 0] as [number, number, number], size: [0.5, 2, depth] as [number, number, number] },
      ].map(({ pos, size }, i) => (
        <mesh key={i} position={pos} receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color="#94A3B8"
            transparent
            opacity={0.25}
          />
        </mesh>
      ))}

      {/* Thin border line on floor */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(width, 0.05, depth)]}
        />
        <lineBasicMaterial color="#CBD5E1" />
      </lineSegments>
    </group>
  );
}
