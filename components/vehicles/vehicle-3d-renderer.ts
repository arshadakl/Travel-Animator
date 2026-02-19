"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import type { VehicleType } from "@/lib/types"

// Color schemes for each vehicle type (hex numbers for Three.js)
const VEHICLE_COLORS: Record<VehicleType, { primary: number; secondary: number; accent: number }> = {
  plane: { primary: 0x3B82F6, secondary: 0x1E40AF, accent: 0xFCD34D },
  car: { primary: 0xEF4444, secondary: 0x991B1B, accent: 0xF97316 },
  train: { primary: 0x10B981, secondary: 0x065F46, accent: 0xFBBF24 },
  ship: { primary: 0x8B5CF6, secondary: 0x5B21B6, accent: 0x60A5FA },
}

interface Vehicle3DRendererOptions {
  vehicle: VehicleType
  size?: number
}

export class Vehicle3DRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private vehicleGroup: THREE.Group
  private animationId: number | null = null
  private canvas: HTMLCanvasElement
  
  constructor(options: Vehicle3DRendererOptions) {
    const { vehicle, size = 64 } = options
    
    // Create canvas
    this.canvas = document.createElement("canvas")
    this.canvas.width = size
    this.canvas.height = size
    
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = null
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    this.camera.position.set(0, 1.5, 3)
    this.camera.lookAt(0, 0, 0)
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.setSize(size, size)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(2, 5, 3)
    this.scene.add(directionalLight)
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-2, 3, -3)
    this.scene.add(fillLight)
    
    // Create vehicle
    this.vehicleGroup = this.createVehicle(vehicle)
    this.scene.add(this.vehicleGroup)
    
    // Initial render
    this.render()
  }
  
  private createVehicle(vehicle: VehicleType): THREE.Group {
    const group = new THREE.Group()
    const colors = VEHICLE_COLORS[vehicle]
    
    switch (vehicle) {
      case "plane":
        this.createAirplane(group, colors)
        break
      case "car":
        this.createCar(group, colors)
        break
      case "train":
        this.createTrain(group, colors)
        break
      case "ship":
        this.createShip(group, colors)
        break
    }
    
    return group
  }
  
  private createAirplane(group: THREE.Group, colors: { primary: number; secondary: number; accent: number }) {
    // Fuselage
    const fuselageGeo = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8)
    const fuselageMat = new THREE.MeshStandardMaterial({ 
      color: colors.primary, 
      metalness: 0.6, 
      roughness: 0.3 
    })
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
    fuselage.rotation.x = Math.PI / 2
    group.add(fuselage)
    
    // Wings
    const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.3)
    const wingMat = new THREE.MeshStandardMaterial({ 
      color: colors.secondary, 
      metalness: 0.5, 
      roughness: 0.4 
    })
    const wings = new THREE.Mesh(wingGeo, wingMat)
    wings.position.set(0, 0, 0.1)
    wings.rotation.x = Math.PI / 2
    group.add(wings)
    
    // Tail
    const tailGeo = new THREE.BoxGeometry(0.4, 0.05, 0.25)
    const tail = new THREE.Mesh(tailGeo, wingMat)
    tail.position.set(0, -0.35, 0.05)
    tail.rotation.x = Math.PI / 2
    group.add(tail)
    
    // Vertical stabilizer
    const vStabGeo = new THREE.BoxGeometry(0.05, 0.3, 0.2)
    const vStab = new THREE.Mesh(vStabGeo, wingMat)
    vStab.position.set(0, -0.35, 0)
    vStab.rotation.x = 0.3
    group.add(vStab)
    
    // Engines
    const engineGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8)
    const engineMat = new THREE.MeshStandardMaterial({ 
      color: colors.accent, 
      metalness: 0.7, 
      roughness: 0.2 
    })
    
    const leftEngine = new THREE.Mesh(engineGeo, engineMat)
    leftEngine.position.set(-0.35, 0, 0.1)
    leftEngine.rotation.x = Math.PI / 2
    group.add(leftEngine)
    
    const rightEngine = new THREE.Mesh(engineGeo, engineMat)
    rightEngine.position.set(0.35, 0, 0.1)
    rightEngine.rotation.x = Math.PI / 2
    group.add(rightEngine)
  }
  
  private createCar(group: THREE.Group, colors: { primary: number; secondary: number; accent: number }) {
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.2, 0.9)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: colors.primary, 
      metalness: 0.6, 
      roughness: 0.3 
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.15
    group.add(body)
    
    // Cabin
    const cabinGeo = new THREE.BoxGeometry(0.4, 0.18, 0.4)
    const cabinMat = new THREE.MeshStandardMaterial({ 
      color: colors.secondary, 
      metalness: 0.5, 
      roughness: 0.4 
    })
    const cabin = new THREE.Mesh(cabinGeo, cabinMat)
    cabin.position.set(0, 0.34, -0.05)
    group.add(cabin)
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16)
    const wheelMat = new THREE.MeshStandardMaterial({ 
      color: 0x1F2937, 
      roughness: 0.8 
    })
    
    const positions = [
      [-0.22, 0.1, 0.3],
      [0.22, 0.1, 0.3],
      [-0.22, 0.1, -0.3],
      [0.22, 0.1, -0.3],
    ]
    
    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(...pos as [number, number, number])
      wheel.rotation.z = Math.PI / 2
      group.add(wheel)
    })
  }
  
  private createTrain(group: THREE.Group, colors: { primary: number; secondary: number; accent: number }) {
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 1.2)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: colors.primary, 
      metalness: 0.5, 
      roughness: 0.4 
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.3
    group.add(body)
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16)
    const wheelMat = new THREE.MeshStandardMaterial({ 
      color: 0x1F2937, 
      metalness: 0.7, 
      roughness: 0.5 
    })
    
    const wheelPositions = [
      [-0.25, 0.12, -0.35],
      [0.25, 0.12, -0.35],
      [-0.25, 0.12, 0.35],
      [0.25, 0.12, 0.35],
    ]
    
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(...pos as [number, number, number])
      wheel.rotation.z = Math.PI / 2
      group.add(wheel)
    })
  }
  
  private createShip(group: THREE.Group, colors: { primary: number; secondary: number; accent: number }) {
    // Hull - using a scaled box for simplicity
    const hullGeo = new THREE.BoxGeometry(0.6, 0.25, 1)
    const hullMat = new THREE.MeshStandardMaterial({ 
      color: colors.primary, 
      metalness: 0.4, 
      roughness: 0.5 
    })
    const hull = new THREE.Mesh(hullGeo, hullMat)
    hull.rotation.x = Math.PI / 2
    group.add(hull)
    
    // Cabin
    const cabinGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3)
    const cabinMat = new THREE.MeshStandardMaterial({ 
      color: colors.secondary, 
      metalness: 0.5, 
      roughness: 0.4 
    })
    const cabin = new THREE.Mesh(cabinGeo, cabinMat)
    cabin.position.set(0, 0.2, -0.05)
    cabin.rotation.x = Math.PI / 2
    group.add(cabin)
    
    // Smokestack
    const stackGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.15, 8)
    const stackMat = new THREE.MeshStandardMaterial({ 
      color: colors.accent, 
      metalness: 0.6, 
      roughness: 0.3 
    })
    const stack = new THREE.Mesh(stackGeo, stackMat)
    stack.position.set(0, 0.35, -0.15)
    stack.rotation.x = Math.PI / 2
    group.add(stack)
  }
  
  setRotation(bearing: number) {
    if (this.vehicleGroup) {
      // Convert bearing to radians
      // Bearing: 0 = North, 90 = East, 180 = South, 270 = West
      // Three.js: We need to rotate around Y axis
      // Subtract 90 degrees because vehicle models face "right" (positive X) by default
      // but bearing is measured from North (positive Y)
      const rotationRad = ((bearing - 90) * Math.PI) / 180
      this.vehicleGroup.rotation.y = rotationRad
      this.render()
    }
  }
  
  render() {
    this.renderer.render(this.scene, this.camera)
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
  
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.renderer.dispose()
    this.scene.clear()
  }
}

// Hook for React integration
export function useVehicle3DRenderer(vehicle: VehicleType, size: number = 64) {
  const rendererRef = useRef<Vehicle3DRenderer | null>(null)
  
  useEffect(() => {
    rendererRef.current = new Vehicle3DRenderer({ vehicle, size })
    
    return () => {
      rendererRef.current?.dispose()
    }
  }, [vehicle, size])
  
  return rendererRef
}

export default Vehicle3DRenderer
