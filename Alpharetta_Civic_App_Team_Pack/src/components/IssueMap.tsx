import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../types/civic';

/** `note` describes an unverified point (e.g. "approximate map point"); null for verified locations. */
export type MapPoint = { id: string; title: string; number: number; coords: LatLng; note: string | null };

type Props = {
  points: MapPoint[];
  origin: (LatLng & { label: string }) | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Used only when there are no points or starting location to frame the map.
const FALLBACK_CENTER: L.LatLngTuple = [34.0754, -84.2941];

const pinIcon = (p: MapPoint, selected: boolean) =>
  L.divIcon({
    className: '',
    // Only the numeric pin number is interpolated into HTML; titles are set as attributes below.
    html: `<span class="pin${selected ? ' pin--selected' : ''}${p.note ? ' pin--unverified' : ''}"><span>${Number(p.number)}</span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });

/**
 * Leaflet map with OpenStreetMap tiles (free, no API key). Only records with valid
 * coordinates are passed in, so a record without a location never gets a marker.
 * Markers are created once per data change and only restyled on selection, so a
 * keyboard user's focus stays on the pin they chose.
 */
export function IssueMap({ points, origin, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; point: MapPoint }>());
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selectedId;
  }, [onSelect, selectedId]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    // No initial view here: the marker effect below sets it, so tiles load once at the right zoom.
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    let errors = 0;
    tiles.on('tileerror', () => {
      errors += 1;
      if (errors >= 3) setTilesFailed(true);
    });
    tiles.on('tileload', () => {
      errors = 0;
      setTilesFailed(false);
    });
    tiles.addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
    };
  }, []);

  // Frame the map and build markers when the data or starting location changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    // Set the view first: Leaflet only creates marker elements once the map has a view,
    // and the accessibility attributes below need those elements.
    const latlngs: L.LatLngTuple[] = points.map((p) => [p.coords.latitude, p.coords.longitude]);
    if (origin) latlngs.push([origin.latitude, origin.longitude]);
    if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36], maxZoom: 16 });
    else if (latlngs.length === 1) map.setView(latlngs[0], 15);
    else map.setView(FALLBACK_CENTER, 14);

    for (const p of points) {
      const label = `Map pin ${p.number}: ${p.title}${p.note ? ` (${p.note})` : ''}`;
      const marker = L.marker([p.coords.latitude, p.coords.longitude], {
        title: label,
        riseOnHover: true,
        icon: pinIcon(p, p.id === selectedRef.current),
        zIndexOffset: p.id === selectedRef.current ? 1000 : 0,
      });
      marker.on('click', () => onSelectRef.current(p.id));
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          e.originalEvent.preventDefault();
          onSelectRef.current(p.id);
        }
      });
      layer.addLayer(marker);
      const el = marker.getElement();
      el?.setAttribute('aria-label', label);
      el?.setAttribute('aria-pressed', String(p.id === selectedRef.current));
      markersRef.current.set(p.id, { marker, point: p });
    }

    if (origin) {
      const o = L.marker([origin.latitude, origin.longitude], {
        title: `${origin.label} (starting location)`,
        keyboard: false,
        interactive: false,
        icon: L.divIcon({ className: '', html: '<span class="origin-dot"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      });
      layer.addLayer(o);
    }

  }, [points, origin]);

  // Restyle markers on selection without recreating their DOM nodes.
  useEffect(() => {
    for (const [id, { marker, point }] of markersRef.current) {
      const selected = id === selectedId;
      const el = marker.getElement();
      const hadFocus = el !== undefined && el === document.activeElement;
      marker.setIcon(pinIcon(point, selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      const next = marker.getElement();
      next?.setAttribute('aria-pressed', String(selected));
      if (hadFocus) next?.focus();
    }
    const sel = selectedId ? markersRef.current.get(selectedId) : undefined;
    if (sel && mapRef.current) mapRef.current.panTo(sel.marker.getLatLng());
  }, [selectedId]);

  return (
    <div className="map">
      <div ref={containerRef} className="map__canvas" role="region" aria-label="Map of issues that have a map point" />
      <div className="map__notices">
        {tilesFailed && (
          <p className="map__notice" role="status">
            Map background couldn’t load (you may be offline). Markers and the list still work.
          </p>
        )}
        {points.length === 0 && <p className="map__notice">None of the listed issues has map coordinates.</p>}
      </div>
    </div>
  );
}
