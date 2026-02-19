"use client"

import { useRef } from "react"
import { Map, Route, Sparkles } from "lucide-react"
import { RouteInput } from "@/components/features/route-input"
import { AnimationControls } from "@/components/features/animation-controls"
import { MapPreview, type MapPreviewHandle } from "@/components/features/map-preview"
import { useVideoExport } from "@/hooks/use-video-export"
import { useRoute } from "@/hooks/use-route"
import { useAnimation } from "@/hooks/use-animation"
import { useStops } from "@/hooks/use-stops"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function EditorLayout() {
  const mapRef = useRef<MapPreviewHandle>(null)
  const { stops, addStop, removeStop, updateStop, moveStop, setStops } = useStops()
  const { routeGeometry, isLoading: isLoadingRoute } = useRoute(stops, "plane")
  const { 
    startRecording, 
    stopRecording, 
    downloadBlob,
    isRecording: isExporting 
  } = useVideoExport()
  
  const animation = useAnimation({
    mapRef,
    routeGeometry,
    startRecording,
    stopRecording,
    downloadBlob,
  })

  const hasRoute = routeGeometry !== null

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-background overflow-hidden">
      {/* Left Sidebar - Now at bottom on mobile, left on desktop */}
      <aside className="flex w-full md:w-80 shrink-0 flex-col border-t md:border-t-0 md:border-r border-border bg-card max-h-[45vh] md:max-h-none order-2 md:order-1">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-3 md:py-4 border-b border-border shrink-0">
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-primary">
            <Map className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-semibold text-foreground tracking-tight">
              Travel Animator
            </h1>
            <p className="text-[9px] md:text-[10px] text-muted-foreground">
              Route to video in seconds
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 md:gap-5 p-3 md:p-4">
            {/* Route Section */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Route
              </span>
              {isLoadingRoute && (
                <span className="ml-auto text-[10px] text-primary animate-pulse">
                  Loading...
                </span>
              )}
            </div>
            <RouteInput 
              stops={stops} 
              onStopsChange={setStops}
              onAddStop={addStop}
              onRemoveStop={removeStop}
              onUpdateStop={updateStop}
              onMoveStop={moveStop}
            />

            <Separator className="bg-border" />

            {/* Animation Section */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Animation
              </span>
            </div>
            <AnimationControls
              animation={{ ...animation, isRecording: isExporting }}
              onAnimationChange={animation.updateState}
              onPlay={animation.play}
              onPause={animation.pause}
              onReset={animation.reset}
              onExport={animation.exportVideo}
              hasRoute={hasRoute}
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-3 md:px-4 py-2 md:py-3 shrink-0 hidden md:block">
          <p className="text-[10px] text-muted-foreground text-center">
            Maps by CARTO / OpenStreetMap. Routing by OSRM.
          </p>
        </div>
      </aside>

      {/* Main Map Area - Now on top on mobile, right on desktop */}
      <main className="relative flex-1 min-h-0 overflow-hidden order-1 md:order-2">
        <MapPreview ref={mapRef} stops={stops} route={routeGeometry} />

        {/* Recording indicator */}
        {isExporting && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1.5 md:gap-2 rounded-md bg-destructive/90 px-2 md:px-3 py-1 md:py-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-foreground animate-pulse" />
            <span className="text-[10px] md:text-xs font-medium text-foreground">
              Recording... {Math.round(animation.progress * 100)}%
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
