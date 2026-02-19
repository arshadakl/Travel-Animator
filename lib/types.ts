export interface RouteStop {
  id: string
  name: string
  coord: [number, number] | null
  isGeocoding: boolean
}

export type VehicleType = "plane" | "car" | "train" | "ship"

export interface AnimationState {
  isPlaying: boolean
  progress: number
  speed: number
  vehicle: VehicleType
  vehicleSize: number
  isRecording: boolean
}

export interface AppState {
  stops: RouteStop[]
  animation: AnimationState
  routeGeometry: GeoJSON.Feature<GeoJSON.LineString> | null
}
