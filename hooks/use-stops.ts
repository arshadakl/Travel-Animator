"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { RouteStop } from "@/lib/types"

interface UseStopsReturn {
  stops: RouteStop[]
  addStop: () => void
  removeStop: (id: string) => void
  updateStop: (id: string, updates: Partial<RouteStop>) => void
  moveStop: (fromIndex: number, toIndex: number) => void
  setStops: (stops: RouteStop[]) => void
}

export function useStops(initialStops?: RouteStop[]): UseStopsReturn {
  const [stops, setStops] = useState<RouteStop[]>(
    initialStops ?? [
      { id: crypto.randomUUID(), name: "", coord: null, isGeocoding: false },
      { id: crypto.randomUUID(), name: "", coord: null, isGeocoding: false },
    ]
  )

  const addStop = useCallback(() => {
    setStops((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        coord: null,
        isGeocoding: false,
      },
    ])
  }, [])

  const removeStop = useCallback((id: string) => {
    setStops((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const updateStop = useCallback((id: string, updates: Partial<RouteStop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  const moveStop = useCallback((fromIndex: number, toIndex: number) => {
    setStops((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const newStops = [...prev]
      const [moved] = newStops.splice(fromIndex, 1)
      newStops.splice(toIndex, 0, moved)
      return newStops
    })
  }, [])

  return {
    stops,
    addStop,
    removeStop,
    updateStop,
    moveStop,
    setStops,
  }
}
