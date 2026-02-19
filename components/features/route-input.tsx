"use client"

import {
  Plus,
  X,
  GripVertical,
  MapPin,
  Loader2,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { RouteStop } from "@/lib/types"
import { useGeocoding } from "@/hooks/use-geocoding"
import { useRef, useEffect } from "react"

interface RouteInputProps {
  stops: RouteStop[]
  onStopsChange: (stops: RouteStop[]) => void
  onAddStop: () => void
  onRemoveStop: (id: string) => void
  onUpdateStop: (id: string, updates: Partial<RouteStop>) => void
  onMoveStop: (fromIndex: number, toIndex: number) => void
}

export function RouteInput({ 
  stops, 
  onStopsChange,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  onMoveStop,
}: RouteInputProps) {
  const {
    suggestions,
    activeSuggestionId,
    loadingSuggestions,
    updateStopName,
    selectSuggestion,
    closeSuggestions,
    geocodeStop,
    setActiveSuggestionId,
  } = useGeocoding({ stops, onUpdateStop })

  const suggestionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedInside = Array.from(suggestionRefs.current.values()).some(
        (ref) => ref?.contains(e.target as Node)
      )
      if (!clickedInside) {
        closeSuggestions()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [closeSuggestions])

  const locatedCount = stops.filter((s) => s.coord).length

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs md:text-sm font-medium text-foreground">Route Stops</h2>
        <span className="text-[10px] md:text-xs text-muted-foreground">
          {locatedCount}/{stops.length} located
        </span>
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2">
        {stops.map((stop, index) => (
          <StopInput
            key={stop.id}
            stop={stop}
            index={index}
            totalStops={stops.length}
            suggestions={suggestions.get(stop.id) ?? []}
            isActive={activeSuggestionId === stop.id}
            isLoading={stop.isGeocoding || loadingSuggestions.has(stop.id)}
            onNameChange={(name) => updateStopName(stop.id, name)}
            onSuggestionSelect={(suggestion) => selectSuggestion(stop.id, suggestion)}
            onGeocode={() => geocodeStop(stop.id)}
            onRemove={() => onRemoveStop(stop.id)}
            onMoveUp={() => onMoveStop(index, index - 1)}
            onMoveDown={() => onMoveStop(index, index + 1)}
            onFocus={() => {
              const stopSuggestions = suggestions.get(stop.id)
              if (stopSuggestions && stopSuggestions.length > 0) {
                setActiveSuggestionId(stop.id)
              }
            }}
            containerRef={(el) => {
              if (el) suggestionRefs.current.set(stop.id, el)
            }}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onAddStop}
        className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-secondary h-8 md:h-9 text-xs md:text-sm"
      >
        <Plus className="mr-1 md:mr-1.5 h-3 w-3 md:h-3.5 md:w-3.5" />
        Add Stop
      </Button>

      {locatedCount >= 2 && (
        <div className="mt-1 flex items-center gap-1.5 md:gap-2 rounded-md bg-primary/10 px-2 md:px-3 py-1.5 md:py-2">
          <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary shrink-0" />
          <span className="text-[10px] md:text-xs text-primary">
            Route ready - {locatedCount} stops mapped
          </span>
        </div>
      )}
    </div>
  )
}

interface StopInputProps {
  stop: RouteStop
  index: number
  totalStops: number
  suggestions: import("@/lib/geocode").AutocompleteSuggestion[]
  isActive: boolean
  isLoading: boolean
  onNameChange: (name: string) => void
  onSuggestionSelect: (suggestion: import("@/lib/geocode").AutocompleteSuggestion) => void
  onGeocode: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  containerRef: (el: HTMLDivElement | null) => void
  onFocus: () => void
}

function StopInput({
  stop,
  index,
  totalStops,
  suggestions,
  isActive,
  isLoading,
  onNameChange,
  onSuggestionSelect,
  onGeocode,
  onRemove,
  onMoveUp,
  onMoveDown,
  onFocus,
  containerRef,
}: StopInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        onSuggestionSelect(suggestions[0])
      } else {
        onGeocode()
      }
    }
  }

  return (
    <div className="group flex items-center gap-1.5 md:gap-2">
      <div className="flex-col gap-0.5 hidden md:flex">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
          aria-label="Move stop up"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>

      <div className="flex h-5 w-5 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] md:text-xs font-mono text-secondary-foreground">
        {index + 1}
      </div>

      <div className="relative flex-1" ref={containerRef}>
        <Input
          value={stop.name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={
            index === 0
              ? "Starting point..."
              : index === totalStops - 1
                ? "Destination..."
                : "Add a stop..."
          }
          className="h-8 md:h-9 bg-secondary border-border text-xs md:text-sm pr-8 text-foreground placeholder:text-muted-foreground"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : stop.coord ? (
            <MapPin className="h-3.5 w-3.5 text-primary" />
          ) : stop.name ? (
            <button
              onClick={onGeocode}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Search location"
            >
              <Navigation className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {isActive && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionSelect(suggestion)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-start gap-2 border-b border-border last:border-0"
              >
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-popover-foreground text-xs leading-relaxed">
                  {suggestion.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={totalStops <= 2}
        className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        aria-label="Remove stop"
      >
        <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
      </Button>
    </div>
  )
}
