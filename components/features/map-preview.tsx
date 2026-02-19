"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import * as turf from "@turf/turf"
import type { RouteStop, VehicleType } from "@/lib/types"
import {
  getRouteLength,
  getPointAlongRoute,
  getBearing,
} from "@/lib/routing"
import { MAP_STYLE, ROUTE_COLORS } from "@/lib/constants"
import { Vehicle3DRenderer } from "@/components/vehicles/vehicle-3d-renderer"

export interface MapPreviewHandle {
  startAnimation: (
    route: GeoJSON.Feature<GeoJSON.LineString>,
    speed: number,
    vehicle: VehicleType,
    vehicleSize: number,
    onProgress: (progress: number) => void,
    onComplete: () => void
  ) => void
  stopAnimation: () => void
  resetView: (route: GeoJSON.Feature<GeoJSON.LineString>) => void
  getCanvas: () => HTMLCanvasElement | null
  getCompositeCanvas: () => HTMLCanvasElement | null
  stopCompositeCanvas: () => void
}

interface MapPreviewProps {
  stops: RouteStop[]
  route: GeoJSON.Feature<GeoJSON.LineString> | null
}

const MapPreview = forwardRef<MapPreviewHandle, MapPreviewProps>(
  function MapPreview({ stops, route }, ref) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const animationFrame = useRef<number | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const stopMarkersRef = useRef<maplibregl.Marker[]>([])
    
    // Composite canvas for video export
    const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const compositeCtxRef = useRef<CanvasRenderingContext2D | null>(null)
    const compositorFrameRef = useRef<number | null>(null)

    // Initialize map
    useEffect(() => {
      if (!mapContainer.current || map.current) return

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [20, 30],
        zoom: 2,
        pitch: 40,
        bearing: 0,
        preserveDrawingBuffer: true,
      })

      map.current.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        "bottom-right"
      )

      map.current.on("load", () => {
        const m = map.current!

        // Route line background
        m.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        })

        m.addLayer({
          id: "route-bg",
          type: "line",
          source: "route",
          paint: {
            "line-color": ROUTE_COLORS.background,
            "line-width": 6,
            "line-opacity": 0.4,
          },
        })

        // Route trail (animated portion)
        m.addSource("route-trail", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        })

        m.addLayer({
          id: "route-trail",
          type: "line",
          source: "route-trail",
          paint: {
            "line-color": ROUTE_COLORS.trail,
            "line-width": 4,
            "line-opacity": 1,
          },
        })

        // Dashed overlay
        m.addLayer({
          id: "route-dash",
          type: "line",
          source: "route",
          paint: {
            "line-color": ROUTE_COLORS.dash,
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-dasharray": [2, 3],
          },
        })
      })

      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current)
        }
        vehicleRendererRef.current?.dispose()
        vehicleRendererRef.current = null
        map.current?.remove()
        map.current = null
      }
    }, [])

    // Update stop markers
    useEffect(() => {
      stopMarkersRef.current.forEach((m) => m.remove())
      stopMarkersRef.current = []

      if (!map.current) return

      stops.forEach((stop, index) => {
        if (!stop.coord) return

        const marker = createStopMarker(stop, index)
        marker.addTo(map.current!)
        stopMarkersRef.current.push(marker)
      })

      fitMapToStops(map.current, stops)
    }, [stops])

    // Update route line
    useEffect(() => {
      if (!map.current) return

      const m = map.current
      const updateRoute = () => {
        const source = m.getSource("route") as maplibregl.GeoJSONSource
        if (!source) return

        if (route) {
          source.setData(route)
          fitMapToRoute(m, route)
        } else {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          })
        }
      }

      if (m.isStyleLoaded()) {
        updateRoute()
      } else {
        m.on("load", updateRoute)
      }
    }, [route])

    // 3D Vehicle renderer ref
    const vehicleRendererRef = useRef<Vehicle3DRenderer | null>(null)

    // Animation controls
    const startAnimation = useCallback(
      (
        routeData: GeoJSON.Feature<GeoJSON.LineString>,
        speed: number,
        vehicle: VehicleType,
        vehicleSize: number,
        onProgress: (progress: number) => void,
        onComplete: () => void
      ) => {
        if (!map.current) return

        const m = map.current
        const totalLength = getRouteLength(routeData)
        const baseDuration = Math.max(8, Math.min(30, totalLength / 500))
        const duration = (baseDuration / speed) * 1000

        // Calculate actual size (base 64px * vehicleSize multiplier)
        const actualSize = Math.round(64 * vehicleSize)

        // Remove existing marker
        markerRef.current?.remove()
        vehicleRendererRef.current?.dispose()

        // Create 3D vehicle renderer with dynamic size
        vehicleRendererRef.current = new Vehicle3DRenderer({ 
          vehicle, 
          size: actualSize 
        })
        
        // Get the canvas element from the renderer
        const canvas = vehicleRendererRef.current.getCanvas()
        canvas.style.cssText = `
          width: ${actualSize}px;
          height: ${actualSize}px;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        `

        const startCoord = getPointAlongRoute(routeData, 0)
        markerRef.current = new maplibregl.Marker({
          element: canvas,
          rotationAlignment: "map",
        })
          .setLngLat(startCoord)
          .addTo(m)

        let startTime: number | null = null
        let previousBearing = 0

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const elapsed = timestamp - startTime
          const progress = Math.min(elapsed / duration, 1)
          const distance = totalLength * progress
          const point = getPointAlongRoute(routeData, distance)

          // Update marker position
          markerRef.current?.setLngLat(point)

          // Update 3D vehicle rotation to face the route direction
          if (progress < 0.999 && vehicleRendererRef.current) {
            const lookAheadDist = Math.min(distance + totalLength * 0.01, totalLength)
            const lookAhead = getPointAlongRoute(routeData, lookAheadDist)
            const bearing = getBearing(point, lookAhead)
            
            // Smooth rotation transition
            let rotationDiff = bearing - previousBearing
            // Normalize to -180 to 180
            while (rotationDiff > 180) rotationDiff -= 360
            while (rotationDiff < -180) rotationDiff += 360
            const smoothedBearing = previousBearing + rotationDiff * 0.1
            previousBearing = smoothedBearing
            
            // Apply rotation - add 90 degrees because vehicle models face right (positive X)
            // but bearing is measured from north (positive Y)
            vehicleRendererRef.current.setRotation(smoothedBearing)
          }

          // Update trail
          updateRouteTrail(m, routeData, progress)

          // Camera follow
          const lookAheadDist = Math.min(distance + totalLength * 0.05, totalLength)
          const lookAhead = getPointAlongRoute(routeData, lookAheadDist)
          m.easeTo({
            center: point,
            zoom: Math.min(6 + progress * 3, 10),
            pitch: 45 + progress * 10,
            bearing: progress < 0.999 ? getBearing(point, lookAhead) * 0.3 : 0,
            duration: 0,
          })

          onProgress(progress)

          if (progress >= 1) {
            onComplete()
            return
          }

          animationFrame.current = requestAnimationFrame(animate)
        }

        animationFrame.current = requestAnimationFrame(animate)
      },
      []
    )

    const stopAnimation = useCallback(() => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }
    }, [])

    const resetView = useCallback(
      (routeData: GeoJSON.Feature<GeoJSON.LineString>) => {
        if (!map.current) return

        markerRef.current?.remove()
        markerRef.current = null
        
        // Dispose 3D renderer
        vehicleRendererRef.current?.dispose()
        vehicleRendererRef.current = null

        // Clear trail
        const trailSource = map.current.getSource("route-trail") as maplibregl.GeoJSONSource
        if (trailSource) {
          trailSource.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          })
        }

        fitMapToRoute(map.current, routeData)
      },
      []
    )

    const getCanvas = useCallback((): HTMLCanvasElement | null => {
      return map.current?.getCanvas() ?? null
    }, [])

    // Get composite canvas with vehicle rendered on top (for video export)
    const getCompositeCanvas = useCallback((): HTMLCanvasElement | null => {
      const mapCanvas = map.current?.getCanvas()
      if (!mapCanvas) return null
      
      // Create composite canvas if not exists
      if (!compositeCanvasRef.current) {
        compositeCanvasRef.current = document.createElement('canvas')
        compositeCanvasRef.current.width = mapCanvas.width
        compositeCanvasRef.current.height = mapCanvas.height
        compositeCtxRef.current = compositeCanvasRef.current.getContext('2d')
      }
      
      const compositeCanvas = compositeCanvasRef.current
      const ctx = compositeCtxRef.current
      if (!ctx) return null
      
      // Start continuous composition
      const composeFrame = () => {
        // Clear canvas
        ctx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height)
        
        // Draw map
        ctx.drawImage(mapCanvas, 0, 0)
        
        // If we have a vehicle marker, draw it too
        if (markerRef.current && vehicleRendererRef.current) {
          const vehicleCanvas = vehicleRendererRef.current.getCanvas()
          
          // Get marker position on screen
          const markerPos = markerRef.current.getLngLat()
          const point = map.current?.project(markerPos)
          
          if (point) {
            const vehicleSize = vehicleCanvas.width
            const x = point.x - vehicleSize / 2
            const y = point.y - vehicleSize / 2
            
            // Draw vehicle centered at marker position
            ctx.drawImage(vehicleCanvas, x, y)
          }
        }
        
        compositorFrameRef.current = requestAnimationFrame(composeFrame)
      }
      
      // Start composition loop
      compositorFrameRef.current = requestAnimationFrame(composeFrame)
      
      return compositeCanvas
    }, [])
    
    // Stop composite canvas animation
    const stopCompositeCanvas = useCallback(() => {
      if (compositorFrameRef.current) {
        cancelAnimationFrame(compositorFrameRef.current)
        compositorFrameRef.current = null
      }
    }, [])

    useImperativeHandle(ref, () => ({
      startAnimation,
      stopAnimation,
      resetView,
      getCanvas,
      getCompositeCanvas,
      stopCompositeCanvas,
    }))

    return (
      <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
        <div ref={mapContainer} className="h-full w-full" />
        {!route && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Add stops and search locations to see your route
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
)

// Helper functions
function createStopMarker(stop: RouteStop, index: number): maplibregl.Marker {
  const el = document.createElement("div")
  el.className = "stop-marker"
  el.style.cssText = `
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    border: 3px solid ${ROUTE_COLORS.stopBorder};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: ${ROUTE_COLORS.stopBorder};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  `
  el.textContent = String(index + 1)

  return new maplibregl.Marker({ element: el })
    .setLngLat(stop.coord!)
    .setPopup(
      new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(
        `<div style="font-size:13px;font-weight:500;color:#202124;background:#ffffff;padding:8px 12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${stop.name}</div>`
      )
    )
}

function fitMapToStops(map: maplibregl.Map, stops: RouteStop[]) {
  const validCoords = stops.filter((s) => s.coord).map((s) => s.coord!)
  
  if (validCoords.length >= 2) {
    const bounds = new maplibregl.LngLatBounds()
    validCoords.forEach((c) => bounds.extend(c))
    map.fitBounds(bounds, { padding: 80, duration: 1000 })
  } else if (validCoords.length === 1) {
    map.flyTo({
      center: validCoords[0],
      zoom: 8,
      duration: 1000,
    })
  }
}

function fitMapToRoute(map: maplibregl.Map, route: GeoJSON.Feature<GeoJSON.LineString>) {
  const coords = route.geometry.coordinates
  if (coords.length >= 2) {
    const bounds = new maplibregl.LngLatBounds()
    coords.forEach((c) => bounds.extend(c as [number, number]))
    map.fitBounds(bounds, { padding: 80, duration: 1200, pitch: 45 })
  }
}

function updateRouteTrail(
  map: maplibregl.Map,
  route: GeoJSON.Feature<GeoJSON.LineString>,
  progress: number
) {
  const trailCoords = route.geometry.coordinates.slice(
    0,
    Math.ceil(progress * route.geometry.coordinates.length)
  )
  const trailSource = map.getSource("route-trail") as maplibregl.GeoJSONSource
  if (trailSource) {
    trailSource.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: trailCoords,
      },
    })
  }
}

MapPreview.displayName = "MapPreview"

export { MapPreview }
