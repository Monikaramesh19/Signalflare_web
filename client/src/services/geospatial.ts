export interface EmergencyResource {
  id: string;
  name: string;
  type: 'RESCUE_TEAM' | 'SHELTER' | 'HOSPITAL' | 'FIRE_STATION' | 'POLICE_STATION';
  latitude: number;
  longitude: number;
  status: string;
  availability: string;
  capacity?: string;
  contact: string;
}

export interface DisasterZone {
  id: string;
  name: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  latitude: number;
  longitude: number;
  radius: number; // in km
  status: string;
}

export const CHENNAI_FALLBACK = {
  lat: 13.0827,
  lng: 80.2707,
};

export const DEMO_RESOURCES: EmergencyResource[] = [
  // Rescue Teams
  {
    id: 'res-1',
    name: '🚑 Chennai Alpha Rescuers',
    type: 'RESCUE_TEAM',
    latitude: 13.0827,
    longitude: 80.2707,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    contact: '044-22334401',
  },
  {
    id: 'res-2',
    name: '🚑 Kochi Delta Rescuers',
    type: 'RESCUE_TEAM',
    latitude: 13.0427,
    longitude: 80.2822,
    status: 'STANDBY',
    availability: 'AVAILABLE',
    contact: '044-22334402',
  },
  {
    id: 'res-3',
    name: '🚑 Madurai Beta Rescuers',
    type: 'RESCUE_TEAM',
    latitude: 13.0063,
    longitude: 80.2574,
    status: 'ACTIVE',
    availability: 'BUSY',
    contact: '044-22334403',
  },
  // Shelters
  {
    id: 'sh-1',
    name: '🏠 Chennai Central Shelter',
    type: 'SHELTER',
    latitude: 13.0827,
    longitude: 80.2707,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    capacity: '72 / 158 beds',
    contact: '044-22334455',
  },
  {
    id: 'sh-2',
    name: '🏠 Kanchipuram Temple Safehouse',
    type: 'SHELTER',
    latitude: 12.8342,
    longitude: 79.7036,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    capacity: '34 / 120 beds',
    contact: '044-22334456',
  },
  {
    id: 'sh-3',
    name: '🏠 Chengalpattu Community Hall',
    type: 'SHELTER',
    latitude: 12.6841,
    longitude: 79.9836,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    capacity: '95 / 200 beds',
    contact: '044-22334457',
  },
  {
    id: 'sh-4',
    name: '🏠 Chennai Beach Ground Camp',
    type: 'SHELTER',
    latitude: 13.0427,
    longitude: 80.2822,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    capacity: '145 / 300 beds',
    contact: '044-22334458',
  },
  {
    id: 'sh-5',
    name: '🏠 Adyar Rescue Base',
    type: 'SHELTER',
    latitude: 13.0063,
    longitude: 80.2574,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    capacity: '80 / 150 beds',
    contact: '044-22334459',
  },
  {
    id: 'sh-6',
    name: '🏠 Tambaram Transit Camp',
    type: 'SHELTER',
    latitude: 12.9249,
    longitude: 80.1240,
    status: 'ACTIVE',
    availability: 'FULL',
    capacity: '180 / 180 beds',
    contact: '044-22334460',
  },
  // Hospitals
  {
    id: 'hosp-1',
    name: '🏥 Chennai General Hospital',
    type: 'HOSPITAL',
    latitude: 13.0815,
    longitude: 80.2730,
    status: 'ACTIVE',
    availability: 'OPEN',
    contact: '044-25301111',
  },
  {
    id: 'hosp-2',
    name: '🏥 Apollo Greams Road',
    type: 'HOSPITAL',
    latitude: 13.0602,
    longitude: 80.2514,
    status: 'ACTIVE',
    availability: 'OPEN',
    contact: '044-28290200',
  },
  {
    id: 'hosp-3',
    name: '🏥 Fortis Malar Hospital',
    type: 'HOSPITAL',
    latitude: 13.0076,
    longitude: 80.2562,
    status: 'ACTIVE',
    availability: 'OPEN',
    contact: '044-42424242',
  },
  // Fire Stations
  {
    id: 'fire-1',
    name: '🚒 Egmore Fire Station',
    type: 'FIRE_STATION',
    latitude: 13.0782,
    longitude: 80.2605,
    status: 'ACTIVE',
    availability: 'DISPATCHING',
    contact: '101',
  },
  {
    id: 'fire-2',
    name: '🚒 T. Nagar Fire Station',
    type: 'FIRE_STATION',
    latitude: 13.0430,
    longitude: 80.2392,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    contact: '101',
  },
  // Police Stations
  {
    id: 'police-1',
    name: '👮 Guindy Police Station',
    type: 'POLICE_STATION',
    latitude: 13.0084,
    longitude: 80.2131,
    status: 'ACTIVE',
    availability: 'ON PATROL',
    contact: '100',
  },
  {
    id: 'police-2',
    name: '👮 Mylapore Police Station',
    type: 'POLICE_STATION',
    latitude: 13.0335,
    longitude: 80.2685,
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    contact: '100',
  },
];

export const DEMO_ZONES: DisasterZone[] = [
  {
    id: 'zone-1',
    name: '🔴 Adyar Flood Risk Zone',
    type: 'FLOOD_RISK',
    severity: 'CRITICAL',
    latitude: 13.0063,
    longitude: 80.2574,
    radius: 1.5, // 1.5 km
    status: 'EVACUATION_REQUIRED',
  },
  {
    id: 'zone-2',
    name: '🔴 Marina Beach Cyclone Impact Zone',
    type: 'CYCLONE_IMPACT',
    severity: 'HIGH',
    latitude: 13.0427,
    longitude: 80.2822,
    radius: 2.0, // 2 km
    status: 'HIGH_ALERT',
  },
];

// Haversine distance calculator in km
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// Check if user is inside a disaster zone
export const isInsideEmergencyZone = (
  userLat: number,
  userLng: number,
  zone: DisasterZone
): boolean => {
  const distance = getDistance(userLat, userLng, zone.latitude, zone.longitude);
  return distance <= zone.radius;
};

// Sort all emergency resources by proximity
export const getNearbyResources = (
  userLat: number,
  userLng: number
): (EmergencyResource & { distance: number })[] => {
  return DEMO_RESOURCES.map((r) => ({
    ...r,
    distance: getDistance(userLat, userLng, r.latitude, r.longitude),
  })).sort((a, b) => a.distance - b.distance);
};

// Find nearest resource of specific type
export const getNearestResource = (
  userLat: number,
  userLng: number,
  type: 'RESCUE_TEAM' | 'SHELTER' | 'HOSPITAL' | 'FIRE_STATION' | 'POLICE_STATION'
): (EmergencyResource & { distance: number }) | null => {
  const filtered = getNearbyResources(userLat, userLng).filter((r) => r.type === type);
  return filtered.length > 0 ? filtered[0] : null;
};
