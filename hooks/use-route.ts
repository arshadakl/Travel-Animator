"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getRoute } from "@/lib/routing"
import type { RouteStop, VehicleType } from "@/lib/types"

interface UseRouteReturn {
  routeGeometry: GeoJSON.Feature<GeoJSON.LineString> | null
  isLoading: boolean
}

export function useRoute(stops: RouteStop[], vehicle: VehicleType): UseRouteReturn {
  const [routeGeometry, setRouteGeometry] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const prevCoordsRef = useRef<string>("")

  useEffect(() => {
    const validStops = stops.filter((s) => s.coord)
    const coordKey = validStops.map((s) => s.coord!.join(",")).join("|")

    if (coordKey === prevCoordsRef.current) return
    prevCoordsRef.current = coordKey

    if (validStops.length < 2) {
      setRouteGeometry(null)
      return
    }

    const fetchRoute = async () => {
      setIsLoading(true)
      try {
        const coords = validStops.map((s) => s.coord!)
        const route = await getRoute(coords, vehicle)
        setRouteGeometry(route)
      } catch (error) {
        console.error("Failed to fetch route:", error)
        setRouteGeometry(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoute()
  }, [stops, vehicle])

  return { routeGeometry, isLoading }
}
