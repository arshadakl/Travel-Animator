const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

let lastRequestTime = 0
const MIN_INTERVAL = 1100 // Nominatim requires max 1 req/sec

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest)
    )
  }
  lastRequestTime = Date.now()
  return fetch(url)
}

export async function geocode(
  query: string
): Promise<{ coord: [number, number]; displayName: string } | null> {
  try {
    const res = await rateLimitedFetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`
    )
    const data: NominatimResult[] = await res.json()
    if (data.length > 0) {
      return {
        coord: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
        displayName: data[0].display_name,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function geocodeBatch(
  queries: string[]
): Promise<({ coord: [number, number]; displayName: string } | null)[]> {
  const results: ({ coord: [number, number]; displayName: string } | null)[] =
    []
  for (const query of queries) {
    const result = await geocode(query)
    results.push(result)
  }
  return results
}

export interface AutocompleteSuggestion {
  displayName: string
  coord: [number, number]
}

export async function autocomplete(
  query: string
): Promise<AutocompleteSuggestion[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const res = await rateLimitedFetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
    )
    const data: NominatimResult[] = await res.json()
    return data.map((item) => ({
      displayName: item.display_name,
      coord: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
    }))
  } catch {
    return []
  }
}
