export interface CaliforniaLocation {
  id: string
  name: string
  type: 'county' | 'city'
  parentId?: string // For cities, this is the county ID
  population?: number
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface CaliforniaCounty {
  id: string
  name: string
  cities: CaliforniaLocation[]
  population?: number
  coordinates?: {
    lat: number
    lng: number
  }
}

// California Counties with major cities
export const CALIFORNIA_COUNTIES: CaliforniaCounty[] = [
  {
    id: 'los-angeles',
    name: 'Los Angeles County',
    population: 10039107,
    coordinates: { lat: 34.0522, lng: -118.2437 },
    cities: [
      { id: 'los-angeles-city', name: 'Los Angeles', type: 'city', parentId: 'los-angeles', population: 3979576 },
      { id: 'long-beach', name: 'Long Beach', type: 'city', parentId: 'los-angeles', population: 466742 },
      { id: 'glendale', name: 'Glendale', type: 'city', parentId: 'los-angeles', population: 200061 },
      { id: 'pasadena', name: 'Pasadena', type: 'city', parentId: 'los-angeles', population: 141029 },
      { id: 'santa-clarita', name: 'Santa Clarita', type: 'city', parentId: 'los-angeles', population: 228673 },
      { id: 'pomona', name: 'Pomona', type: 'city', parentId: 'los-angeles', population: 151713 },
      { id: 'torrance', name: 'Torrance', type: 'city', parentId: 'los-angeles', population: 147067 },
      { id: 'gardena', name: 'Gardena', type: 'city', parentId: 'los-angeles', population: 58829 },
      { id: 'culver-city', name: 'Culver City', type: 'city', parentId: 'los-angeles', population: 39835 },
      { id: 'burbank', name: 'Burbank', type: 'city', parentId: 'los-angeles', population: 103340 }
    ]
  },
  {
    id: 'orange',
    name: 'Orange County',
    population: 3164182,
    coordinates: { lat: 33.7175, lng: -117.8311 },
    cities: [
      { id: 'anaheim', name: 'Anaheim', type: 'city', parentId: 'orange', population: 346824 },
      { id: 'santa-ana', name: 'Santa Ana', type: 'city', parentId: 'orange', population: 332318 },
      { id: 'irvine', name: 'Irvine', type: 'city', parentId: 'orange', population: 307670 },
      { id: 'huntington-beach', name: 'Huntington Beach', type: 'city', parentId: 'orange', population: 199223 },
      { id: 'garden-grove', name: 'Garden Grove', type: 'city', parentId: 'orange', population: 170883 },
      { id: 'fullerton', name: 'Fullerton', type: 'city', parentId: 'orange', population: 135161 },
      { id: 'costa-mesa', name: 'Costa Mesa', type: 'city', parentId: 'orange', population: 113825 },
      { id: 'westminster', name: 'Westminster', type: 'city', parentId: 'orange', population: 92014 },
      { id: 'newport-beach', name: 'Newport Beach', type: 'city', parentId: 'orange', population: 85239 },
      { id: 'mission-viejo', name: 'Mission Viejo', type: 'city', parentId: 'orange', population: 93653 }
    ]
  },
  {
    id: 'san-diego',
    name: 'San Diego County',
    population: 3338330,
    coordinates: { lat: 32.7157, lng: -117.1611 },
    cities: [
      { id: 'san-diego-city', name: 'San Diego', type: 'city', parentId: 'san-diego', population: 1419516 },
      { id: 'chula-vista', name: 'Chula Vista', type: 'city', parentId: 'san-diego', population: 275487 },
      { id: 'oceanside', name: 'Oceanside', type: 'city', parentId: 'san-diego', population: 175742 },
      { id: 'escondido', name: 'Escondido', type: 'city', parentId: 'san-diego', population: 151625 },
      { id: 'carlsbad', name: 'Carlsbad', type: 'city', parentId: 'san-diego', population: 114746 },
      { id: 'vista', name: 'Vista', type: 'city', parentId: 'san-diego', population: 101638 },
      { id: 'san-marcos', name: 'San Marcos', type: 'city', parentId: 'san-diego', population: 94833 },
      { id: 'encinitas', name: 'Encinitas', type: 'city', parentId: 'san-diego', population: 62006 },
      { id: 'national-city', name: 'National City', type: 'city', parentId: 'san-diego', population: 61394 },
      { id: 'la-mesa', name: 'La Mesa', type: 'city', parentId: 'san-diego', population: 59978 }
    ]
  },
  {
    id: 'san-francisco',
    name: 'San Francisco County',
    population: 873965,
    coordinates: { lat: 37.7749, lng: -122.4194 },
    cities: [
      { id: 'san-francisco-city', name: 'San Francisco', type: 'city', parentId: 'san-francisco', population: 873965 }
    ]
  },
  {
    id: 'alameda',
    name: 'Alameda County',
    population: 1671329,
    coordinates: { lat: 37.6469, lng: -121.8895 },
    cities: [
      { id: 'oakland', name: 'Oakland', type: 'city', parentId: 'alameda', population: 440646 },
      { id: 'fremont', name: 'Fremont', type: 'city', parentId: 'alameda', population: 230504 },
      { id: 'berkeley', name: 'Berkeley', type: 'city', parentId: 'alameda', population: 124321 },
      { id: 'hayward', name: 'Hayward', type: 'city', parentId: 'alameda', population: 162954 },
      { id: 'livermore', name: 'Livermore', type: 'city', parentId: 'alameda', population: 87055 },
      { id: 'pleasanton', name: 'Pleasanton', type: 'city', parentId: 'alameda', population: 81471 },
      { id: 'dublin', name: 'Dublin', type: 'city', parentId: 'alameda', population: 63605 },
      { id: 'union-city', name: 'Union City', type: 'city', parentId: 'alameda', population: 74000 },
      { id: 'san-leandro', name: 'San Leandro', type: 'city', parentId: 'alameda', population: 89102 },
      { id: 'newark', name: 'Newark', type: 'city', parentId: 'alameda', population: 48143 }
    ]
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara County',
    population: 1937668,
    coordinates: { lat: 37.3541, lng: -121.9552 },
    cities: [
      { id: 'san-jose', name: 'San Jose', type: 'city', parentId: 'santa-clara', population: 1030119 },
      { id: 'sunnyvale', name: 'Sunnyvale', type: 'city', parentId: 'santa-clara', population: 155805 },
      { id: 'santa-clara', name: 'Santa Clara', type: 'city', parentId: 'santa-clara', population: 127647 },
      { id: 'mountain-view', name: 'Mountain View', type: 'city', parentId: 'santa-clara', population: 82786 },
      { id: 'palo-alto', name: 'Palo Alto', type: 'city', parentId: 'santa-clara', population: 68572 },
      { id: 'cupertino', name: 'Cupertino', type: 'city', parentId: 'santa-clara', population: 60381 },
      { id: 'milpitas', name: 'Milpitas', type: 'city', parentId: 'santa-clara', population: 75468 },
      { id: 'campbell', name: 'Campbell', type: 'city', parentId: 'santa-clara', population: 43216 },
      { id: 'los-gatos', name: 'Los Gatos', type: 'city', parentId: 'santa-clara', population: 31275 },
      { id: 'gilroy', name: 'Gilroy', type: 'city', parentId: 'santa-clara', population: 55297 }
    ]
  },
  {
    id: 'sacramento',
    name: 'Sacramento County',
    population: 1588921,
    coordinates: { lat: 38.5816, lng: -121.4944 },
    cities: [
      { id: 'sacramento-city', name: 'Sacramento', type: 'city', parentId: 'sacramento', population: 513624 },
      { id: 'roseville', name: 'Roseville', type: 'city', parentId: 'sacramento', population: 141500 },
      { id: 'elk-grove', name: 'Elk Grove', type: 'city', parentId: 'sacramento', population: 176124 },
      { id: 'folsom', name: 'Folsom', type: 'city', parentId: 'sacramento', population: 79772 },
      { id: 'rancho-cordova', name: 'Rancho Cordova', type: 'city', parentId: 'sacramento', population: 79232 },
      { id: 'citrus-heights', name: 'Citrus Heights', type: 'city', parentId: 'sacramento', population: 87311 },
      { id: 'galt', name: 'Galt', type: 'city', parentId: 'sacramento', population: 25884 },
      { id: 'isleton', name: 'Isleton', type: 'city', parentId: 'sacramento', population: 804 },
      { id: 'rancho-murieta', name: 'Rancho Murieta', type: 'city', parentId: 'sacramento', population: 6000 }
    ]
  },
  {
    id: 'riverside',
    name: 'Riverside County',
    population: 2470546,
    coordinates: { lat: 33.9533, lng: -117.3962 },
    cities: [
      { id: 'riverside-city', name: 'Riverside', type: 'city', parentId: 'riverside', population: 314998 },
      { id: 'moreno-valley', name: 'Moreno Valley', type: 'city', parentId: 'riverside', population: 208634 },
      { id: 'corona', name: 'Corona', type: 'city', parentId: 'riverside', population: 169868 },
      { id: 'murrieta', name: 'Murrieta', type: 'city', parentId: 'riverside', population: 115561 },
      { id: 'temecula', name: 'Temecula', type: 'city', parentId: 'riverside', population: 110003 },
      { id: 'hemet', name: 'Hemet', type: 'city', parentId: 'riverside', population: 89833 },
      { id: 'indio', name: 'Indio', type: 'city', parentId: 'riverside', population: 89137 },
      { id: 'lake-elsinore', name: 'Lake Elsinore', type: 'city', parentId: 'riverside', population: 70265 },
      { id: 'palm-desert', name: 'Palm Desert', type: 'city', parentId: 'riverside', population: 52300 },
      { id: 'perris', name: 'Perris', type: 'city', parentId: 'riverside', population: 78636 }
    ]
  },
  {
    id: 'san-bernardino',
    name: 'San Bernardino County',
    population: 2180085,
    coordinates: { lat: 34.1083, lng: -117.2898 },
    cities: [
      { id: 'san-bernardino-city', name: 'San Bernardino', type: 'city', parentId: 'san-bernardino', population: 222101 },
      { id: 'fontana', name: 'Fontana', type: 'city', parentId: 'san-bernardino', population: 212475 },
      { id: 'rancho-cucamonga', name: 'Rancho Cucamonga', type: 'city', parentId: 'san-bernardino', population: 178060 },
      { id: 'ontario', name: 'Ontario', type: 'city', parentId: 'san-bernardino', population: 175265 },
      { id: 'victorville', name: 'Victorville', type: 'city', parentId: 'san-bernardino', population: 134810 },
      { id: 'hesperia', name: 'Hesperia', type: 'city', parentId: 'san-bernardino', population: 95678 },
      { id: 'chino', name: 'Chino', type: 'city', parentId: 'san-bernardino', population: 91685 },
      { id: 'chino-hills', name: 'Chino Hills', type: 'city', parentId: 'san-bernardino', population: 78811 },
      { id: 'upland', name: 'Upland', type: 'city', parentId: 'san-bernardino', population: 76514 },
      { id: 'redlands', name: 'Redlands', type: 'city', parentId: 'san-bernardino', population: 71616 }
    ]
  }
]

// Helper functions
export const getAllCaliforniaLocations = (): CaliforniaLocation[] => {
  const locations: CaliforniaLocation[] = []
  
  CALIFORNIA_COUNTIES.forEach(county => {
    // Add county
    locations.push({
      id: county.id,
      name: county.name,
      type: 'county',
      population: county.population,
      coordinates: county.coordinates
    })
    
    // Add cities
    county.cities.forEach(city => {
      locations.push(city)
    })
  })
  
  return locations
}

export const getCaliforniaCounties = (): CaliforniaLocation[] => {
  return CALIFORNIA_COUNTIES.map(county => ({
    id: county.id,
    name: county.name,
    type: 'county',
    population: county.population,
    coordinates: county.coordinates
  }))
}

export const getCitiesByCounty = (countyId: string): CaliforniaLocation[] => {
  const county = CALIFORNIA_COUNTIES.find(c => c.id === countyId)
  return county ? county.cities : []
}

export const getCountyById = (countyId: string): CaliforniaCounty | undefined => {
  return CALIFORNIA_COUNTIES.find(c => c.id === countyId)
}

export const getLocationById = (locationId: string): CaliforniaLocation | undefined => {
  const allLocations = getAllCaliforniaLocations()
  return allLocations.find(loc => loc.id === locationId)
}

export const searchCaliforniaLocations = (query: string): CaliforniaLocation[] => {
  const allLocations = getAllCaliforniaLocations()
  const lowerQuery = query.toLowerCase()
  
  return allLocations.filter(location => 
    location.name.toLowerCase().includes(lowerQuery)
  )
}
