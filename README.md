# Travel Animator

A beautiful web application that creates animated travel route videos from your journey stops. Visualize your trips with 3D vehicles moving along real-world routes and export them as shareable videos.

## Features

- **Route Planning**: Add multiple stops and see the route drawn on an interactive map
- **3D Animated Vehicles**: Choose from Plane, Car, Train, or Ship with realistic 3D models
- **Video Export**: Record your animated journey and download as a WebM video
- **Vehicle Customization**: Adjust vehicle size and animation speed
- **Responsive Design**: Works on desktop and mobile devices
- **Real-world Routing**: Uses OSRM for accurate driving routes and great circle calculations for flights

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **3D Graphics**: Three.js with React Three Fiber
- **Maps**: MapLibre GL
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: Nominatim

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/arshadakl/Travel-Animator.git
cd Travel-Animator
```

2. Install dependencies
```bash
pnpm install
```

3. Run the development server
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Add Stops**: Enter location names in the route stops section
2. **Search Locations**: Click the search icon or press Enter to geocode locations
3. **Select Vehicle**: Choose your preferred vehicle type (Plane, Car, Train, Ship)
4. **Adjust Settings**: 
   - Set animation speed (0.5x - 5x)
   - Adjust vehicle size (50% - 200%)
5. **Play Animation**: Click the Play button to watch your journey
6. **Export Video**: Click Export Video to download your animated route

## How It Works

### Route Generation
- Enter start and destination points
- Add intermediate stops for multi-city trips
- The app automatically calculates the optimal route using OSRM API
- Flight paths use great circle routes for realistic air travel

### 3D Vehicles
- Built with Three.js for smooth 3D rendering
- Each vehicle type has unique 3D geometry
- Vehicles rotate to face the direction of travel
- Real-time rendering at 60fps

### Video Export
- Uses MediaRecorder API to capture canvas
- Exports high-quality WebM video
- Includes both map and 3D vehicle in the recording

## Project Structure

```
app/                    # Next.js app router pages
components/
  features/            # Main application components
    editor-layout.tsx  # Main layout
    map-preview.tsx    # Interactive map
    route-input.tsx    # Stop management
    animation-controls.tsx  # Playback controls
  ui/                  # shadcn/ui components (50+)
  vehicles/            # 3D vehicle components
hooks/                 # Custom React hooks
lib/                   # Utilities, types, constants
```

## Key Components

### MapPreview
- Interactive map using MapLibre GL
- Displays route lines and stop markers
- Animates vehicle along the path
- Supports video recording

### AnimationControls
- Vehicle type selector (Plane, Car, Train, Ship)
- Speed control slider
- Vehicle size slider
- Play/Pause/Reset controls
- Export Video button

### RouteInput
- Add/remove stops
- Drag to reorder stops
- Autocomplete suggestions
- Geocoding integration

## Customization

### Changing Vehicle Colors
Edit `components/vehicles/vehicle-3d-renderer.ts`:

```typescript
const VEHICLE_COLORS = {
  plane: { primary: 0x3B82F6, secondary: 0x1E40AF, accent: 0xFCD34D },
  car: { primary: 0xEF4444, secondary: 0x991B1B, accent: 0xF97316 },
  train: { primary: 0x10B981, secondary: 0x065F46, accent: 0xFBBF24 },
  ship: { primary: 0x8B5CF6, secondary: 0x5B21B6, accent: 0x60A5FA },
}
```

### Using Custom 3D Models

1. Export your GLB models to `/public/models/`
2. Update the vehicle loader in `vehicle-3d-renderer.ts`
3. See `docs/3D-VEHICLES.md` for detailed instructions

## Performance

- Map tiles: CARTO basemaps (light theme)
- 3D rendering: Hardware accelerated WebGL
- Route calculation: Async with loading states
- Video export: Canvas capture at 30fps

## Contributing

Feel free to fork and submit pull requests!
