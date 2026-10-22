import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../types/civic';

export type MapPoint = { id: string; title: string; number: number; coords: LatLng; sample: boolean };

type Props = {
  points: MapPoint[];
  origin: (LatLng & { label: string }) | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Used only when there are no points or demo point to frame the map.
const FALLBACK_CENTER: L.LatLngTuple = [34.0754, -84.2941];

/**
 * Leaflet map with OpenStreetMap tiles (free, no API key). Only records with valid
 * coordinates are passed in, so a record without a location never gets a marker.
 */
export function IssueMap({ points, origin, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView(FALLBACK_CENTER, 14);
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
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw markers whenever data or selection changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    for (const p of points) {
      const selected = p.id === selectedId;
      const marker = L.marker([p.coords.latitude, p.coords.longitude], {
        title: `${p.number}. ${p.title}${p.sample ? ' (sample map point)' : ''}`,
        alt: p.title,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : 0,
        icon: L.divIcon({
          className: '',
          html: `<span class="pin${selected ? ' pin--selected' : ''}${p.sample ? ' pin--sample' : ''}"><span>${p.number}</span></span>`,
          iconSize: [34, 42],
          iconAnchor: [17, 40],
        }),
      });
      marker.on('click', () => onSelectRef.current(p.id));
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') onSelectRef.current(p.id);
      });
      layer.addLayer(marker);
    }

    if (origin) {
      L.marker([origin.latitude, origin.longitude], {
        title: `${origin.label} (fictional demo point)`,
        alt: origin.label,
        keyboard: false,
        icon: L.divIcon({ className: '', html: '<span class="origin-dot"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(layer);
    }
  }, [points, origin, selectedId]);

  // Frame all markers when the set of points or the demo point changes.
  const frameKey = points.map((p) => p.id).join('|') + (origin ? `@${origin.latitude},${origin.longitude}` : '');
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const latlngs: L.LatLngTuple[] = points.map((p) => [p.coords.latitude, p.coords.longitude]);
    if (origin) latlngs.push([origin.latitude, origin.longitude]);
    if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36], maxZoom: 16 });
    else if (latlngs.length === 1) map.setView(latlngs[0], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  // Pan to a newly selected marker.
  useEffect(() => {
    const map = mapRef.current;
    const p = points.find((x) => x.id === selectedId);
    if (map && p) map.panTo([p.coords.latitude, p.coords.longitude]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="map">
      <div ref={containerRef} className="map__canvas" role="region" aria-label="Map of issues that have a map point" />
      {tilesFailed && (
        <p className="map__notice" role="status">
          Map background couldn’t load (you may be offline). Markers and the list still work.
        </p>
      )}
      {points.length === 0 && <p className="map__notice">None of the listed issues has map coordinates.</p>}
    </div>
  );
}
