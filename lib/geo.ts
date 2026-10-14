export const OFFICE = {
  lat: Number(process.env.NEXT_PUBLIC_OFFICE_LAT),
  lng: Number(process.env.NEXT_PUBLIC_OFFICE_LNG),
  radius: Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS_M ?? 150),
};

/** Haversine distance in meters */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Extracts "lat,lng" from a Google Maps link (…/@24.86,67.00,17z or ?q=24.86,67.00) */
export function coordsFromMapsLink(url: string) {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

export function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
      rej,
      { enableHighAccuracy: true, timeout: 15000 }
    )
  );
}
