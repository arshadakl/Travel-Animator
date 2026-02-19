import type { VehicleType } from "./types"

export const VEHICLE_EMOJIS: Record<VehicleType, string> = {
  plane: "✈️",
  car: "🚗",
  train: "🚂",
  ship: "🚢",
}

export const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

export const VEHICLE_CONFIG = {
  color: "#EA4335",
  shadowColor: "rgba(52, 211, 153, 0.6)",
} as const

export const ROUTE_COLORS = {
  background: "#5F6368",
  trail: "#4285F4",
  dash: "#1A73E8",
  stopBorder: "#4285F4",
} as const

export const ANIMATION_CONFIG = {
  minDuration: 8, // seconds
  maxDuration: 30, // seconds
  fps: 30,
  recordingDelay: 200, // ms
} as const
