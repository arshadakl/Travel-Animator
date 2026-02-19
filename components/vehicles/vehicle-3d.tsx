"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"
import type { VehicleType } from "@/lib/types"

// Color schemes for each vehicle type
const VEHICLE_COLORS: Record<VehicleType, { primary: string; secondary: string; accent: string }> = {
  plane: { primary: "#3B82F6", secondary: "#1E40AF", accent: "#FCD34D" },
  car: { primary: "#EF4444", secondary: "#991B1B", accent: "#F97316" },
  train: { primary: "#10B981", secondary: "#065F46", accent: "#FBBF24" },
  ship: { primary: "#8B5CF6", secondary: "#5B21B6", accent: "#60A5FA" },
}

interface Vehicle3DProps {
  vehicle: VehicleType
  rotation?: number
}

export function Vehicle3D({ vehicle, rotation = 0 }: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  const colors = VEHICLE_COLORS[vehicle]
  
  return (
    <group ref={groupRef} rotation={[0, 0, (rotation * Math.PI) / 180]}>
      {vehicle === "plane" && <Airplane3D colors={colors} />}
      {vehicle === "car" && <Car3D colors={colors} />}
      {vehicle === "train" && <Train3D colors={colors} />}
      {vehicle === "ship" && <Ship3D colors={colors} />}
    </group>
  )
}

// 3D Airplane Component
function Airplane3D({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  const fuselageGeometry = useMemo(() => new THREE.CapsuleGeometry(0.15, 0.8, 4, 8), [])
  const wingGeometry = useMemo(() => new THREE.BoxGeometry(1.2, 0.05, 0.3), [])
  const tailGeometry = useMemo(() => new THREE.BoxGeometry(0.4, 0.05, 0.25), [])
  const verticalStabilizerGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 0.3, 0.2), [])
  const engineGeometry = useMemo(() => new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), [])
  
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Fuselage */}
      <mesh geometry={fuselageGeometry}>
        <meshStandardMaterial color={colors.primary} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Main Wings */}
      <mesh geometry={wingGeometry} position={[0, 0, 0.1]}>
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Horizontal Stabilizer */}
      <mesh geometry={tailGeometry} position={[0, -0.35, 0.05]}>
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Vertical Stabilizer */}
      <mesh geometry={verticalStabilizerGeometry} position={[0, -0.35, 0]} rotation={[0.3, 0, 0]}>
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Left Engine */}
      <mesh geometry={engineGeometry} position={[-0.35, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={colors.accent} metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Right Engine */}
      <mesh geometry={engineGeometry} position={[0.35, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={colors.accent} metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Cockpit Window */}
      <mesh position={[0, 0.12, 0.25]}>
        <boxGeometry args={[0.12, 0.08, 0.15]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// 3D Car Component
function Car3D({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  const bodyGeometry = useMemo(() => new THREE.BoxGeometry(0.5, 0.2, 0.9), [])
  const cabinGeometry = useMemo(() => new THREE.BoxGeometry(0.4, 0.18, 0.4), [])
  const wheelGeometry = useMemo(() => new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), [])
  
  return (
    <group>
      {/* Car Body */}
      <mesh geometry={bodyGeometry} position={[0, 0.15, 0]}>
        <meshStandardMaterial color={colors.primary} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Car Cabin */}
      <mesh geometry={cabinGeometry} position={[0, 0.34, -0.05]}>
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Windows */}
      <mesh position={[0, 0.34, -0.05]}>
        <boxGeometry args={[0.35, 0.15, 0.35]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      
      {/* Front Left Wheel */}
      <mesh geometry={wheelGeometry} position={[-0.22, 0.1, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      
      {/* Front Right Wheel */}
      <mesh geometry={wheelGeometry} position={[0.22, 0.1, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      
      {/* Rear Left Wheel */}
      <mesh geometry={wheelGeometry} position={[-0.22, 0.1, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      
      {/* Rear Right Wheel */}
      <mesh geometry={wheelGeometry} position={[0.22, 0.1, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[-0.15, 0.15, 0.46]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.15, 0.15, 0.46]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// 3D Train Component
function Train3D({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  const bodyGeometry = useMemo(() => new THREE.BoxGeometry(0.5, 0.4, 1.2), [])
  const wheelGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), [])
  
  return (
    <group>
      {/* Train Body */}
      <mesh geometry={bodyGeometry} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={colors.primary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.52, 0.05, 1.22]} />
        <meshStandardMaterial color={colors.secondary} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Windows */}
      <mesh position={[0, 0.35, 0.3]}>
        <boxGeometry args={[0.45, 0.15, 0.3]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.35, -0.3]}>
        <boxGeometry args={[0.45, 0.15, 0.3]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Front Window */}
      <mesh position={[0, 0.35, 0.61]}>
        <boxGeometry args={[0.45, 0.2, 0.02]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Wheels */}
      {[-0.25, 0.25].map((x) =>
        [-0.35, 0.35].map((z) => (
          <mesh key={`${x}-${z}`} geometry={wheelGeometry} position={[x, 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.5} />
          </mesh>
        ))
      )}
      
      {/* Headlight */}
      <mesh position={[0, 0.25, 0.62]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

// 3D Ship Component
function Ship3D({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  // Create a hull shape using a custom geometry
  const hullGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.3)
    shape.lineTo(0.25, 0.2)
    shape.lineTo(0.3, 0)
    shape.lineTo(0.25, -0.3)
    shape.lineTo(-0.25, -0.3)
    shape.lineTo(-0.3, 0)
    shape.lineTo(-0.25, 0.2)
    shape.lineTo(0, 0.3)
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])
  
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Hull */}
      <mesh geometry={hullGeometry} position={[0, 0, -0.075]}>
        <meshStandardMaterial color={colors.primary} metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* Deck */}
      <mesh position={[0, 0.1, -0.075]}>
        <boxGeometry args={[0.5, 0.02, 0.6]} />
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 0.2, -0.05]}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
        <meshStandardMaterial color={colors.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Bridge Windows */}
      <mesh position={[0, 0.22, 0.11]}>
        <boxGeometry args={[0.25, 0.12, 0.02]} />
        <meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Smokestack */}
      <mesh position={[0, 0.35, -0.15]}>
        <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
        <meshStandardMaterial color={colors.accent} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Mast */}
      <mesh position={[-0.1, 0.4, 0.05]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

export default Vehicle3D
