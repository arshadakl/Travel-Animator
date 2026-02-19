"use client"

import { useRef, useCallback, useEffect } from "react"

interface VideoCompositorOptions {
  mapCanvas: HTMLCanvasElement
  vehicleCanvas: HTMLCanvasElement | null
  markerElement: HTMLElement | null
  getMarkerPosition: () => { x: number; y: number } | null
}

export class VideoCompositor {
  private compositeCanvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private mapCanvas: HTMLCanvasElement
  private vehicleCanvas: HTMLCanvasElement | null = null
  private getMarkerPosition: () => { x: number; y: number } | null
  private animationId: number | null = null
  private isRunning = false

  constructor(options: VideoCompositorOptions) {
    const { mapCanvas, vehicleCanvas, getMarkerPosition } = options
    
    this.mapCanvas = mapCanvas
    this.vehicleCanvas = vehicleCanvas
    this.getMarkerPosition = getMarkerPosition
    
    // Create composite canvas
    this.compositeCanvas = document.createElement('canvas')
    this.compositeCanvas.width = mapCanvas.width
    this.compositeCanvas.height = mapCanvas.height
    
    const ctx = this.compositeCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context')
    }
    this.ctx = ctx
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = () => {
    if (!this.isRunning) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height)

    // Draw map
    this.ctx.drawImage(this.mapCanvas, 0, 0)

    // Draw vehicle if available
    if (this.vehicleCanvas) {
      const pos = this.getMarkerPosition()
      if (pos) {
        const vehicleSize = this.vehicleCanvas.width
        const x = pos.x - vehicleSize / 2
        const y = pos.y - vehicleSize / 2
        
        this.ctx.drawImage(this.vehicleCanvas, x, y)
      }
    }

    this.animationId = requestAnimationFrame(this.animate)
  }

  updateVehicleCanvas(canvas: HTMLCanvasElement | null) {
    this.vehicleCanvas = canvas
  }

  getCanvas(): HTMLCanvasElement {
    return this.compositeCanvas
  }

  dispose() {
    this.stop()
  }
}

// Hook for using the compositor
export function useVideoCompositor() {
  const compositorRef = useRef<VideoCompositor | null>(null)

  const startCompositor = useCallback((options: VideoCompositorOptions) => {
    compositorRef.current = new VideoCompositor(options)
    compositorRef.current.start()
    return compositorRef.current.getCanvas()
  }, [])

  const stopCompositor = useCallback(() => {
    compositorRef.current?.stop()
    compositorRef.current = null
  }, [])

  const updateVehicle = useCallback((canvas: HTMLCanvasElement | null) => {
    compositorRef.current?.updateVehicleCanvas(canvas)
  }, [])

  useEffect(() => {
    return () => {
      compositorRef.current?.dispose()
    }
  }, [])

  return {
    startCompositor,
    stopCompositor,
    updateVehicle,
  }
}
