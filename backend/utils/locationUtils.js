// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // distance in meters
}

// Estimate arrival time based on distance and current speed
export function estimateArrivalTime(distanceInMeters, currentSpeedMph) {
  // If speed is too low, assume a default speed of 20 mph
  const speedMph = currentSpeedMph < 5 ? 20 : currentSpeedMph;
  
  // Convert mph to m/s: 1 mph = 0.44704 m/s
  const speedMs = speedMph * 0.44704;
  
  // Calculate time in seconds
  const timeInSeconds = distanceInMeters / speedMs;
  
  // Create arrival time
  const arrivalTime = new Date();
  arrivalTime.setSeconds(arrivalTime.getSeconds() + timeInSeconds);
  
  return arrivalTime;
}

// Convert coordinates to address (this would normally use a geocoding service)
export function getAddressFromCoordinates(latitude, longitude) {
  // This is a placeholder. In a real app, you would use a service like Google Maps API
  // or Mapbox to convert coordinates to a readable address
  
  return "123 Sample Street";
}