"use client"

import {
  Play,
  Pause,
  RotateCcw,
  Plane,
  Car,
  TrainFront,
  Ship,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { AnimationState, VehicleType } from "@/lib/types"

interface AnimationControlsProps {
  animation: AnimationState
  onAnimationChange: (animation: Partial<AnimationState>) => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onExport: () => void
  hasRoute: boolean
}

const vehicles: { type: VehicleType; icon: typeof Plane; label: string }[] = [
  { type: "plane", icon: Plane, label: "Plane" },
  { type: "car", icon: Car, label: "Car" },
  { type: "train", icon: TrainFront, label: "Train" },
  { type: "ship", icon: Ship, label: "Ship" },
]

export function AnimationControls({
  animation,
  onAnimationChange,
  onPlay,
  onPause,
  onReset,
  onExport,
  hasRoute,
}: AnimationControlsProps) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Vehicle Selection */}
      <div className="flex flex-col gap-1.5 md:gap-2">
        <span className="text-xs md:text-sm font-medium text-foreground">Vehicle</span>
        <div className="grid grid-cols-4 gap-1 md:gap-1.5">
          {vehicles.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onAnimationChange({ vehicle: type })}
              className={`flex flex-col items-center gap-0.5 md:gap-1 rounded-md px-1.5 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs transition-colors ${
                animation.vehicle === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              aria-label={`Select ${label}`}
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed Control */}
      <div className="flex flex-col gap-1.5 md:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-foreground">Speed</span>
          <span className="text-[10px] md:text-xs font-mono text-primary">
            {animation.speed.toFixed(1)}x
          </span>
        </div>
        <Slider
          value={[animation.speed]}
          onValueChange={([value]) => onAnimationChange({ speed: value })}
          min={0.5}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-[9px] md:text-[10px] text-muted-foreground">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Vehicle Size Control */}
      <div className="flex flex-col gap-1.5 md:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-foreground">Vehicle Size</span>
          <span className="text-[10px] md:text-xs font-mono text-primary">
            {Math.round(animation.vehicleSize * 100)}%
          </span>
        </div>
        <Slider
          value={[animation.vehicleSize]}
          onValueChange={([value]) => onAnimationChange({ vehicleSize: value })}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[9px] md:text-[10px] text-muted-foreground">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5 md:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-foreground">Progress</span>
          <span className="text-[10px] md:text-xs font-mono text-muted-foreground">
            {Math.round(animation.progress * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${animation.progress * 100}%` }}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <Button
          onClick={onReset}
          variant="outline"
          size="icon"
          className="h-8 w-8 md:h-9 md:w-9 border-border"
          disabled={!hasRoute}
          aria-label="Reset animation"
        >
          <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
        <Button
          onClick={animation.isPlaying ? onPause : onPlay}
          className="flex-1 h-8 md:h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs md:text-sm"
          disabled={!hasRoute}
          aria-label={animation.isPlaying ? "Pause animation" : "Play animation"}
        >
          {animation.isPlaying ? (
            <>
              <Pause className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Pause</span>
              <span className="sm:hidden">||</span>
            </>
          ) : (
            <>
              <Play className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Play</span>
              <span className="sm:hidden">▶</span>
            </>
          )}
        </Button>
      </div>

      {/* Export */}
      <Button
        onClick={onExport}
        variant="outline"
        className="h-8 md:h-9 border-border text-foreground hover:bg-secondary text-xs md:text-sm"
        disabled={!hasRoute || animation.isRecording}
        aria-label="Export video"
      >
        {animation.isRecording ? (
          <>
            <Loader2 className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
            <span className="hidden sm:inline">Recording...</span>
            <span className="sm:hidden">Rec...</span>
          </>
        ) : (
          <>
            <Download className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Export Video</span>
            <span className="sm:hidden">Export</span>
          </>
        )}
      </Button>
    </div>
  )
}
