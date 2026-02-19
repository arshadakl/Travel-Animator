"use client"

import { useEffect, useRef } from "react"
import { createRoot } from "@react-three/fiber"
import * as THREE from "three"
import type { VehicleType } from "@/lib/types"
import { Vehicle3D } from "./vehicle-3d"

interface Vehicle3DMarkerOptions {
  vehicle: VehicleType
  rotation?: number
  size?: number
}

export function createVehicle3DMarker(options: Vehicle3DMarkerOptions): HTMLCanvasElement {
  const { vehicle, rotation = 0, size = 64 } = options
  
  // Create a canvas element
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  
  // Create a Three.js scene
  const scene = new THREE.Scene()
  scene.background = null // Transparent background
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 1.5, 3)
  camera.lookAt(0, 0, 0)
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(size, size)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(2, 5, 3)
  scene.add(directionalLight)
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(-2, 3, -3)
  scene.add(fillLight)
  
  // Create a React root for the 3D scene
  const root = createRoot(canvas)
  
  // Render the vehicle
  root.render(
    <Vehicle3D vehicle={vehicle} rotation={rotation} />
  )
  
  // Force initial render
  renderer.render(scene, camera)
  
  return canvas
}

// Hook to create and update 3D vehicle marker
export function useVehicle3DMarker(
  vehicle: VehicleType,
  rotation: number,
  size: number = 64
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const vehicleRef = useRef<THREE.Group | null>(null)
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)
  
  useEffect(() => {
    // Create canvas
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    canvasRef.current = canvas
    
    // Create scene
    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(2, 5, 3)
    scene.add(directionalLight)
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-2, 3, -3)
    scene.add(fillLight)
    
    // Create React root
    const root = createRoot(canvas)
    rootRef.current = root
    
    // Initial render
    root.render(<Vehicle3D vehicle={vehicle} rotation={rotation} />)
    renderer.render(scene, camera)
    
    return () => {
      root.unmount()
      renderer.dispose()
    }
  }, [])
  
  // Update when vehicle or rotation changes
  useEffect(() => {
    if (!rootRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return
    
    rootRef.current.render(<Vehicle3D vehicle={vehicle} rotation={rotation} />)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [vehicle, rotation])
  
  return canvasRef.current
}

export default createVehicle3DMarker
