"use client"

import { useState, useCallback, useRef, RefObject } from "react"
import { toast } from "sonner"
import type { MapPreviewHandle } from "@/components/features/map-preview"
import type { AnimationState, VehicleType } from "@/lib/types"

interface UseAnimationOptions {
  mapRef: RefObject<MapPreviewHandle | null>
  routeGeometry: GeoJSON.Feature<GeoJSON.LineString> | null
  startRecording: (canvas: HTMLCanvasElement) => void
  stopRecording: () => Promise<Blob | null>
  downloadBlob: (blob: Blob, filename: string) => void
}

interface UseAnimationReturn extends AnimationState {
  play: () => void
  pause: () => void
  reset: () => void
  exportVideo: () => void
  updateState: (partial: Partial<AnimationState>) => void
}

export function useAnimation({
  mapRef,
  routeGeometry,
  startRecording,
  stopRecording,
  downloadBlob,
}: UseAnimationOptions): UseAnimationReturn {
  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    progress: 0,
    speed: 1,
    vehicle: "plane",
    vehicleSize: 1,
    isRecording: false,
  })

  const isRecordingRef = useRef(false)
  
  // Keep ref in sync with state for callbacks
  const updateState = useCallback((partial: Partial<AnimationState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial }
      if (partial.isRecording !== undefined) {
        isRecordingRef.current = partial.isRecording
      }
      return next
    })
  }, [])

  const handleAnimationComplete = useCallback(async () => {
    setState((prev) => ({ ...prev, isPlaying: false, progress: 1 }))
    
    if (isRecordingRef.current) {
      const blob = await stopRecording()
      if (blob) {
        downloadBlob(blob, `travel-animation-${Date.now()}.webm`)
        toast.success("Video exported successfully!")
      }
      updateState({ isRecording: false })
    }
  }, [stopRecording, downloadBlob, updateState])

  const play = useCallback(() => {
    if (!routeGeometry || !mapRef.current) return

    setState((prev) => ({ ...prev, isPlaying: true, progress: 0 }))

    mapRef.current.startAnimation(
      routeGeometry,
      state.speed,
      state.vehicle,
      state.vehicleSize,
      (progress) => {
        setState((prev) => ({ ...prev, progress }))
      },
      handleAnimationComplete
    )
  }, [routeGeometry, state.speed, state.vehicle, state.vehicleSize, mapRef, handleAnimationComplete])

  const pause = useCallback(() => {
    mapRef.current?.stopAnimation()
    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const reset = useCallback(() => {
    mapRef.current?.stopAnimation()
    if (routeGeometry) {
      mapRef.current?.resetView(routeGeometry)
    }
    setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }))
  }, [routeGeometry])

  const exportVideo = useCallback(() => {
    if (!routeGeometry || !mapRef.current) return

    // Use composite canvas that includes the vehicle
    const canvas = mapRef.current.getCompositeCanvas()
    if (!canvas) {
      toast.error("Could not access map canvas")
      return
    }

    startRecording(canvas)
    updateState({
      isRecording: true,
      isPlaying: true,
      progress: 0,
    })

    // Small delay to ensure recorder is ready
    setTimeout(() => {
      mapRef.current?.startAnimation(
        routeGeometry,
        state.speed,
        state.vehicle,
        state.vehicleSize,
        (progress) => {
          setState((prev) => ({ ...prev, progress }))
        },
        async () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            isRecording: false,
            progress: 1,
          }))
          // Stop composite canvas before stopping recording
          mapRef.current?.stopCompositeCanvas()
          const blob = await stopRecording()
          if (blob) {
            downloadBlob(blob, `travel-animation-${Date.now()}.webm`)
            toast.success("Video exported successfully!")
          }
        }
      )
    }, 200)
  }, [routeGeometry, state.speed, state.vehicle, state.vehicleSize, startRecording, stopRecording, downloadBlob, updateState])

  return {
    ...state,
    play,
    pause,
    reset,
    exportVideo,
    updateState,
  }
}
