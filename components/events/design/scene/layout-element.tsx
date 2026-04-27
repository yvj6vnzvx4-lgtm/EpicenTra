"use client";

import { useRef, useState, useCallback } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { LayoutElement as LayoutElementType } from "../types";

interface LayoutElementProps {
  element: LayoutElementType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, z: number) => void;
}

// Invisible floor plane used for raycasting during drag
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function LayoutElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}: LayoutElementProps) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);

  const posY = element.height / 2;

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelect(element.id);
      isDragging.current = true;

      // Calculate drag offset so element doesn't snap to cursor
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2(
        (e.nativeEvent.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.nativeEvent.clientY / gl.domElement.clientHeight) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, intersection);
      dragOffset.current.set(
        intersection.x - element.x,
        0,
        intersection.z - element.z
      );

      gl.domElement.style.cursor = "grabbing";
      gl.domElement.setPointerCapture(e.pointerId);
    },
    [camera, element.id, element.x, element.z, gl, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) return;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2(
        (e.nativeEvent.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.nativeEvent.clientY / gl.domElement.clientHeight) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane, intersection)) {
        onDragEnd(
          element.id,
          intersection.x - dragOffset.current.x,
          intersection.z - dragOffset.current.z
        );
      }
    },
    [camera, element.id, gl, onDragEnd]
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      isDragging.current = false;
      gl.domElement.style.cursor = hovered ? "grab" : "auto";
      gl.domElement.releasePointerCapture(e.pointerId);
    },
    [gl, hovered]
  );

  const selectionColor = isSelected ? "#3B82F6" : hovered ? "#60A5FA" : element.color;

  return (
    <group
      position={[element.x, posY, element.z]}
      rotation={[0, (element.rotationY * Math.PI) / 180, 0]}
    >
      {/* Main body */}
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => {
          setHovered(true);
          gl.domElement.style.cursor = "grab";
        }}
        onPointerLeave={() => {
          setHovered(false);
          if (!isDragging.current) gl.domElement.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[element.width, element.height, element.depth]} />
        <meshStandardMaterial
          color={selectionColor}
          transparent
          opacity={element.type === "zone" ? 0.45 : 0.85}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                element.width + 0.3,
                element.height + 0.3,
                element.depth + 0.3
              ),
            ]}
          />
          <lineBasicMaterial color="#3B82F6" linewidth={2} />
        </lineSegments>
      )}

      {/* Label — floats above element */}
      <Text
        position={[0, element.height / 2 + 2, 0]}
        fontSize={2.2}
        color={isSelected ? "#1D4ED8" : "#334155"}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.3}
        outlineColor="#ffffff"
        font={undefined}
      >
        {element.label}
      </Text>

      {/* Entry/Exit arrow indicator */}
      {element.type === "entry" && (
        <mesh position={[0, element.height / 2 + 0.5, 0]}>
          <coneGeometry args={[1.5, 3, 4]} />
          <meshStandardMaterial color="#10B981" />
        </mesh>
      )}
    </group>
  );
}
