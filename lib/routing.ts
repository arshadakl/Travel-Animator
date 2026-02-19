import * as turf from "@turf/turf"
import type { VehicleType } from "./types"

const OSRM_URL = "https://router.project-osrm.org/route/v1"

export async function getRoute(
  coordinates: [number, number][],
  vehicle: VehicleType
): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  if (coordinates.length < 2) return null

  // For planes/ships, use great circle arcs
  if (vehicle === "plane" || vehicle === "ship") {
    return getGreatCircleRoute(coordinates)
  }

  // For car/train, try OSRM first, fall back to great circle
  try {
    const coordString = coordinates.map((c) => `${c[0]},${c[1]}`).join(";")
    const profile = vehicle === "train" ? "driving" : "driving"
    const res = await fetch(
      `${OSRM_URL}/${profile}/${coordString}?geometries=geojson&overview=full`
    )
    const data = await res.json()

    if (data.code === "Ok" && data.routes?.[0]?.geometry) {
      return {
        type: "Feature",
        properties: {},
        geometry: data.routes[0].geometry,
      }
    }
    // Fall back to great circle
    return getGreatCircleRoute(coordinates)
  } catch {
    return getGreatCircleRoute(coordinates)
  }
}

function getGreatCircleRoute(
  coordinates: [number, number][]
): GeoJSON.Feature<GeoJSON.LineString> {
  const allCoords: [number, number][] = []

  console.log("[v0] Generating great circle route for waypoints:", coordinates.length)

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = turf.point(coordinates[i])
    const end = turf.point(coordinates[i + 1])
    console.log(`[v0] Segment ${i + 1}: from`, coordinates[i], "to", coordinates[i + 1])
    const greatCircle = turf.greatCircle(start, end, { npoints: 100 })

    if (greatCircle.geometry.type === "LineString") {
      const coords = greatCircle.geometry.coordinates as [number, number][]
      if (i === 0) {
        allCoords.push(...coords)
      } else {
        allCoords.push(...coords.slice(1))
      }
    } else {
      // MultiLineString (crosses antimeridian)
      for (const line of greatCircle.geometry.coordinates) {
        const coords = line as [number, number][]
        if (allCoords.length === 0) {
          allCoords.push(...coords)
        } else {
          allCoords.push(...coords.slice(1))
        }
      }
    }
  }

  console.log("[v0] Total route coordinates generated:", allCoords.length)

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: allCoords,
    },
  }
}

export function getRouteLength(
  route: GeoJSON.Feature<GeoJSON.LineString>
): number {
  return turf.length(route, { units: "kilometers" })
}

export function getPointAlongRoute(
  route: GeoJSON.Feature<GeoJSON.LineString>,
  distance: number
): [number, number] {
  const point = turf.along(route, distance, { units: "kilometers" })
  return point.geometry.coordinates as [number, number]
}

export function getBearing(
  from: [number, number],
  to: [number, number]
): number {
  return turf.bearing(turf.point(from), turf.point(to))
}
