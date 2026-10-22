// Near Me demo ranking. Deliberately simple and explainable:
//   1. Issues with valid coordinates, nearest first (straight-line distance).
//   2. Issues with no usable coordinates, kept in the feed as citywide items.
// No geocoding happens anywhere: the only locations are the preset demo points below.

import type { Issue, LatLng } from '../types/civic';

export type DemoLocation = LatLng & { id: string; label: string; description: string };

// Fictional demo points placed near the sample markers. They are NOT addresses
// and must never be presented as the user's real location.
export const DEMO_LOCATIONS: DemoLocation[] = [
  { id: 'demo-north', label: 'Demo point 1', description: 'Fictional point near the northern sample markers', latitude: 34.0795, longitude: -84.2965 },
  { id: 'demo-south', label: 'Demo point 2', description: 'Fictional point near the southern sample markers', latitude: 34.0725, longitude: -84.2925 },
];

/** Rough Alpharetta-area bounds, used only to reject obviously misplaced coordinates. */
const AREA_BOUNDS = { minLat: 33.95, maxLat: 34.2, minLng: -84.45, maxLng: -84.15 };

export function getValidCoordinates(issue: Issue): LatLng | null {
  const lat = issue.location?.latitude;
  const lng = issue.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < AREA_BOUNDS.minLat || lat > AREA_BOUNDS.maxLat || lng < AREA_BOUNDS.minLng || lng > AREA_BOUNDS.maxLng) return null;
  return { latitude: lat, longitude: lng };
}

/** Great-circle distance in miles (haversine formula). */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export type RankedIssue = {
  issue: Issue;
  coords: LatLng | null;
  distance: number | null;
  reason: string;
};

export function rankIssuesForLocation(issues: Issue[], origin: LatLng | null): RankedIssue[] {
  const ranked = issues.map((issue): RankedIssue => {
    const coords = getValidCoordinates(issue);
    const distance = coords && origin ? distanceMiles(origin, coords) : null;
    return { issue, coords, distance, reason: explain(issue, coords, distance, origin) };
  });
  return ranked.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return a.issue.title.localeCompare(b.issue.title);
  });
}

function explain(issue: Issue, coords: LatLng | null, distance: number | null, origin: LatLng | null): string {
  const point = issue.location?.verified ? 'recorded location' : 'sample map point';
  if (coords && distance !== null) {
    const miles = distance < 0.1 ? 'under 0.1' : distance.toFixed(1);
    return `About ${miles} mi from the demo point, measured to its ${point}. This is distance only, not a claim that the issue affects this spot.`;
  }
  if (coords && !origin) return `Has a ${point} on the map. Choose a demo point to sort by distance.`;
  return 'This record has no map location, so it is listed as a citywide item instead of being ranked by distance.';
}
