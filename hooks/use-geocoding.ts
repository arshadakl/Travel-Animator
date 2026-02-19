"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import type { RouteStop } from "@/lib/types"
import { geocode, autocomplete, type AutocompleteSuggestion } from "@/lib/geocode"

interface UseGeocodingReturn {
  suggestions: Map<string, AutocompleteSuggestion[]>
  activeSuggestionId: string | null
  loadingSuggestions: Set<string>
  updateStopName: (id: string, name: string) => void
  selectSuggestion: (id: string, suggestion: AutocompleteSuggestion) => void
  closeSuggestions: (id?: string) => void
  geocodeStop: (id: string) => Promise<void>
  setActiveSuggestionId: (id: string | null) => void
}

interface UseGeocodingOptions {
  stops: RouteStop[]
  onUpdateStop: (id: string, updates: Partial<RouteStop>) => void
}

export function useGeocoding({ stops, onUpdateStop }: UseGeocodingOptions): UseGeocodingReturn {
  const [suggestions, setSuggestions] = useState<Map<string, AutocompleteSuggestion[]>>(new Map())
  const [activeSuggestionId, setActiveSuggestionIdState] = useState<string | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set())
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const setActiveSuggestionId = useCallback((id: string | null) => {
    setActiveSuggestionIdState(id)
  }, [])

  const updateStopName = useCallback(
    (id: string, name: string) => {
      onUpdateStop(id, { name, coord: null })

      // Clear existing timeout
      const existingTimeout = timeoutRef.current.get(id)
      if (existingTimeout) clearTimeout(existingTimeout)

      if (name.trim().length < 2) {
        setSuggestions((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
        setActiveSuggestionIdState(null)
        return
      }

      // Debounce autocomplete
      const timeout = setTimeout(async () => {
        setLoadingSuggestions((prev) => new Set(prev).add(id))
        try {
          const results = await autocomplete(name)
          setSuggestions((prev) => {
            const next = new Map(prev)
            next.set(id, results)
            return next
          })
          setActiveSuggestionIdState(id)
        } finally {
          setLoadingSuggestions((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }
      }, 400)

      timeoutRef.current.set(id, timeout)
    },
    [onUpdateStop]
  )

  const selectSuggestion = useCallback(
    (id: string, suggestion: AutocompleteSuggestion) => {
      onUpdateStop(id, { 
        name: suggestion.displayName, 
        coord: suggestion.coord 
      })
      setSuggestions((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      setActiveSuggestionIdState(null)
    },
    [onUpdateStop]
  )

  const closeSuggestions = useCallback((id?: string) => {
    if (id) {
      setSuggestions((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    }
    setActiveSuggestionIdState(null)
  }, [])

  const geocodeStop = useCallback(
    async (id: string) => {
      const stop = stops.find((s) => s.id === id)
      if (!stop || !stop.name.trim()) return

      onUpdateStop(id, { isGeocoding: true })

      try {
        const result = await geocode(stop.name)
        onUpdateStop(id, {
          coord: result?.coord ?? null,
          isGeocoding: false,
        })
      } catch {
        onUpdateStop(id, { isGeocoding: false })
      }
    },
    [stops, onUpdateStop]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  return {
    suggestions,
    activeSuggestionId,
    loadingSuggestions,
    updateStopName,
    selectSuggestion,
    closeSuggestions,
    geocodeStop,
    setActiveSuggestionId,
  }
}
