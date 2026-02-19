# 3D Vehicles Guide

This guide explains how to use and customize 3D vehicles in the Travel Map Animator.

## Overview

The application now uses **Three.js** to render 3D vehicles instead of static SVG icons. This provides:

- 🎮 Real-time 3D rendering with proper lighting
- 🔄 Smooth rotation based on route direction
- ✨ Professional visual appearance
- 🎨 Customizable colors per vehicle type

## Current 3D Vehicles

The system includes procedurally generated 3D models for all vehicle types:

### ✈️ Airplane
- Detailed fuselage with cockpit windows
- Main wings with proper airfoil shape
- Vertical and horizontal stabilizers
- Twin engines
- Dynamic rotation based on flight direction

### 🚗 Car
- Detailed body with cabin
- Four wheels with proper positioning
- Headlights and windows
- Smooth rotation animation

### 🚂 Train
- Boxy locomotive body
- Multiple wheel sets
- Cabin windows
- Headlight

### 🚢 Ship
- Detailed hull shape
- Bridge/cabin structure
- Smokestack
- Mast

## Architecture

```
components/vehicles/
├── vehicle-3d.tsx          # React Three Fiber components
├── vehicle-3d-renderer.ts  # Canvas-based renderer for MapLibre
└── index.ts                # Barrel exports
```

### How It Works

1. **Vehicle3DRenderer** class creates a Three.js scene in a canvas
2. The canvas is used as a MapLibre marker element
3. During animation, the vehicle's rotation is updated based on bearing
4. The scene is re-rendered each frame for smooth animation

## Customizing Colors

Edit `vehicle-3d-renderer.ts` to change vehicle colors:

```typescript
const VEHICLE_COLORS: Record<VehicleType, { primary: number; secondary: number; accent: number }> = {
  plane: { primary: 0x3B82F6, secondary: 0x1E40AF, accent: 0xFCD34D },
  car: { primary: 0xEF4444, secondary: 0x991B1B, accent: 0xF97316 },
  train: { primary: 0x10B981, secondary: 0x065F46, accent: 0xFBBF24 },
  ship: { primary: 0x8B5CF6, secondary: 0x5B21B6, accent: 0x60A5FA },
}
```

Colors are in hexadecimal format (e.g., `0x3B82F6` = blue).

## Using Custom GLTF/GLB Models

To use your own 3D models from Blender, Sketchfab, or other sources:

### Step 1: Prepare Your Model

1. **Download or create** a GLTF/GLB model
   - Recommended sources: [Sketchfab](https://sketchfab.com), [Google Poly](https://poly.google.com), [Blender](https://blender.org)
   - Ensure the model is optimized for web (low polygon count)

2. **Export as GLB** (recommended)
   - In Blender: File → Export → glTF 2.0 (.glb)
   - Enable "Apply Modifiers" and "Export Materials"

3. **Place in public folder**
   ```
   public/models/
   ├── airplane.glb
   ├── car.glb
   ├── train.glb
   └── ship.glb
   ```

### Step 2: Install GLTF Loader

```bash
npm install @react-three/drei
```

### Step 3: Create GLTF Vehicle Component

Create `components/vehicles/vehicle-gltf.tsx`:

```tsx
"use client"

import { useRef, useMemo } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { VehicleType } from "@/lib/types"

interface VehicleGLTFProps {
  vehicle: VehicleType
  rotation?: number
}

export function VehicleGLTF({ vehicle, rotation = 0 }: VehicleGLTFProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Load GLTF model based on vehicle type
  const modelPath = `/models/${vehicle}.glb`
  const { scene } = useGLTF(modelPath)
  
  // Clone the scene to avoid sharing issues
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  return (
    <group ref={groupRef} rotation={[0, (rotation * Math.PI) / 180, 0]}>
      <primitive object={clonedScene} scale={0.5} />
    </group>
  )
}

// Preload models
useGLTF.preload("/models/plane.glb")
useGLTF.preload("/models/car.glb")
useGLTF.preload("/models/train.glb")
useGLTF.preload("/models/ship.glb")
```

### Step 4: Update Renderer to Use GLTF

Modify `vehicle-3d-renderer.ts` to use GLTF models:

```typescript
import { VehicleGLTF } from "./vehicle-gltf"

// In createVehicle method:
private createVehicle(vehicle: VehicleType): THREE.Group {
  const group = new THREE.Group()
  
  // Use GLTF instead of procedural
  const gltfGroup = new THREE.Group()
  
  // Load GLTF model
  const loader = new GLTFLoader()
  loader.load(`/models/${vehicle}.glb`, (gltf) => {
    const model = gltf.scene
    model.scale.set(0.5, 0.5, 0.5)
    gltfGroup.add(model)
  })
  
  group.add(gltfGroup)
  return group
}
```

### Alternative: Using Drei's useGLTF with Canvas

For better integration with React Three Fiber:

```tsx
"use client"

import { Canvas } from "@react-three/fiber"
import { useGLTF, Environment } from "@react-three/drei"
import type { VehicleType } from "@/lib/types"

interface Vehicle3DCanvasProps {
  vehicle: VehicleType
  rotation?: number
}

export function Vehicle3DCanvas({ vehicle, rotation = 0 }: Vehicle3DCanvasProps) {
  const { scene } = useGLTF(`/models/${vehicle}.glb`)
  
  return (
    <Canvas
      camera={{ position: [0, 2, 4], fov: 50 }}
      style={{ width: 64, height: 64 }}
      gl={{ alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 5, 3]} intensity={1} />
      <primitive 
        object={scene} 
        rotation={[0, (rotation * Math.PI) / 180, 0]}
        scale={0.5}
      />
      <Environment preset="city" />
    </Canvas>
  )
}

useGLTF.preload("/models/plane.glb")
useGLTF.preload("/models/car.glb")
useGLTF.preload("/models/train.glb")
useGLTF.preload("/models/ship.glb")
```

## Performance Tips

1. **Optimize Models**: Keep polygon count under 10,000 triangles per vehicle
2. **Use GLB Format**: Binary format loads faster than glTF
3. **Enable Compression**: Use Draco compression for smaller file sizes
4. **Reuse Geometries**: Share geometry instances when possible
5. **Lazy Loading**: Load models only when needed

## Troubleshooting

### Models Not Appearing
- Check browser console for CORS errors
- Verify model path is correct
- Ensure model files are in the public folder

### Performance Issues
- Reduce polygon count in your 3D models
- Use simpler materials (avoid complex shaders)
- Limit texture sizes to 1024x1024 or smaller

### Rotation Not Working
- Ensure model's forward direction aligns with +Z axis in Blender
- Check that rotation is applied in degrees, not radians

## Example Model Sources

### Free 3D Models
- **Sketchfab**: https://sketchfab.com (filter by "Downloadable")
- **Google Poly**: https://poly.google.com (archive)
- **Clara.io**: https://clara.io
- **Free3D**: https://free3d.com

### Recommended Formats
- **GLB**: Binary glTF (recommended for web)
- **GLTF**: JSON-based with external resources
- **OBJ**: Supported but lacks materials

## License Considerations

When using third-party models, ensure they have appropriate licenses:
- **CC0**: Public domain, free to use
- **CC-BY**: Requires attribution
- **Royalty-free**: May require purchase for commercial use

Always check the license before using models in production!
